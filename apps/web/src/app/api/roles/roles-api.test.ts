import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createWalletAuthMessage } from "@/lib/auth/verify-wallet";
import { connectMongo, resetMongoConnectionForTests } from "@/lib/db/mongodb";
import { RoleModel } from "@/lib/db/models/role.model";
import { UserModel } from "@/lib/db/models/user.model";
import { resetRateLimitsForTests } from "@/lib/auth/rate-limit";
import { resetWalletAuthStoreForTests } from "@/lib/auth/verify-wallet";
import { resetRoleServiceForTests } from "@/lib/roles/server";
import { seedApiSystemRoles } from "@/lib/testing/seed-api-roles";
import { resetUserServiceForTests } from "@/lib/users/server";
import { encodeWalletAuthHeaderMessage } from "@/lib/users/user-mutations";
import { GET, POST } from "./route";
import { DELETE, GET as GET_ROLE, PATCH } from "./[slug]/route";

const ADMIN = privateKeyToAccount(generatePrivateKey());
const READER = privateKeyToAccount(generatePrivateKey());
const ADMIN_ADDRESS = ADMIN.address.toLowerCase();

async function signedPayload(
  account: ReturnType<typeof privateKeyToAccount>,
  extra: Record<string, unknown> = {},
) {
  const { message } = createWalletAuthMessage(account.address);
  const signature = await account.signMessage({ message });
  return {
    address: account.address,
    message,
    signature,
    ...extra,
  };
}

function authHeaders(account: ReturnType<typeof privateKeyToAccount>) {
  return async () => {
    const { message } = createWalletAuthMessage(account.address);
    const signature = await account.signMessage({ message });
    return {
      "x-wallet-address": account.address,
      "x-wallet-message": encodeWalletAuthHeaderMessage(message),
      "x-wallet-signature": signature,
    };
  };
}

describe("roles API", () => {
  let memoryServer: MongoMemoryServer;

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = memoryServer.getUri();
    resetMongoConnectionForTests();
    resetUserServiceForTests();
    resetRoleServiceForTests();
    await connectMongo();
  });

  afterEach(async () => {
    resetWalletAuthStoreForTests();
    resetRateLimitsForTests();
    resetUserServiceForTests();
    resetRoleServiceForTests();
    resetMongoConnectionForTests();
    process.env.MONGODB_URI = memoryServer.getUri();
    await connectMongo();
    await UserModel.deleteMany({});
    await RoleModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    resetMongoConnectionForTests();
    await memoryServer.stop();
  });

  async function seedAdmin() {
    await seedApiSystemRoles();
    await UserModel.create({
      address: ADMIN_ADDRESS,
      roleSlug: "admin",
      status: "active",
    });
  }

  it("GET rejects unsigned list requests", async () => {
    await seedAdmin();
    const response = await GET(new Request("http://localhost/api/roles"));
    expect(response.status).toBe(403);
  });

  it("GET lists roles for an admin signer", async () => {
    await seedAdmin();
    const headers = await authHeaders(ADMIN)();
    const response = await GET(
      new Request("http://localhost/api/roles", { headers }),
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.length).toBeGreaterThanOrEqual(3);
  });

  it("POST creates a custom role", async () => {
    await seedAdmin();
    const body = await signedPayload(ADMIN, {
      slug: "moderator",
      name: "Moderator",
      permissions: ["pages:read", "authors:write:any"],
    });

    const response = await POST(
      new Request("http://localhost/api/roles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.slug).toBe("moderator");
  });

  it("PATCH updates a role and DELETE removes unused custom roles", async () => {
    await seedAdmin();
    const createBody = await signedPayload(ADMIN, {
      slug: "moderator",
      name: "Moderator",
      permissions: ["pages:read"],
    });
    await POST(
      new Request("http://localhost/api/roles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(createBody),
      }),
    );

    const patchBody = await signedPayload(ADMIN, {
      name: "Curator",
      permissions: ["pages:read", "authors:write:any"],
    });
    const patchResponse = await PATCH(
      new Request("http://localhost/api/roles/moderator", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patchBody),
      }),
      { params: Promise.resolve({ slug: "moderator" }) },
    );
    expect(patchResponse.status).toBe(200);

    const getResponse = await GET_ROLE(
      new Request("http://localhost/api/roles/moderator", {
        headers: await authHeaders(ADMIN)(),
      }),
      { params: Promise.resolve({ slug: "moderator" }) },
    );
    expect(getResponse.status).toBe(200);

    const deleteResponse = await DELETE(
      new Request("http://localhost/api/roles/moderator", {
        headers: await authHeaders(ADMIN)(),
      }),
      { params: Promise.resolve({ slug: "moderator" }) },
    );
    expect(deleteResponse.status).toBe(200);
  });

  it("DELETE returns 409 when the role is assigned to users", async () => {
    await seedAdmin();
    const createBody = await signedPayload(ADMIN, {
      slug: "moderator",
      name: "Moderator",
      permissions: ["pages:read"],
    });
    await POST(
      new Request("http://localhost/api/roles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(createBody),
      }),
    );

    await UserModel.create({
      address: READER.address.toLowerCase(),
      roleSlug: "moderator",
      status: "active",
    });

    const deleteResponse = await DELETE(
      new Request("http://localhost/api/roles/moderator", {
        headers: await authHeaders(ADMIN)(),
      }),
      { params: Promise.resolve({ slug: "moderator" }) },
    );

    expect(deleteResponse.status).toBe(409);
    const json = await deleteResponse.json();
    expect(json.error).toContain("assigned to 1 user");
    expect(await RoleModel.exists({ slug: "moderator" })).not.toBeNull();
  });

  it("rejects role mutations for readers", async () => {
    await seedApiSystemRoles();
    await UserModel.create({
      address: READER.address.toLowerCase(),
      roleSlug: "reader",
      status: "active",
    });
    const headers = await authHeaders(READER)();
    const response = await GET(
      new Request("http://localhost/api/roles", { headers }),
    );
    expect(response.status).toBe(403);
  });
});
