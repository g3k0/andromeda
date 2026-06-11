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
import { GET as GET_USER, PATCH, DELETE } from "./[address]/route";

const ADMIN = privateKeyToAccount(generatePrivateKey());
const READER = privateKeyToAccount(generatePrivateKey());
const ADMIN_ADDRESS = ADMIN.address.toLowerCase();
const READER_ADDRESS = READER.address.toLowerCase();

async function signedPayload(
  account: ReturnType<typeof privateKeyToAccount>,
  extra: Record<string, unknown> = {},
) {
  const { message } = await createWalletAuthMessage(account.address);
  const signature = await account.signMessage({ message });
  return {
    address: account.address,
    message,
    signature,
    ...extra,
  };
}

function authHeaders(
  account: ReturnType<typeof privateKeyToAccount>,
) {
  return async () => {
    const { message } = await createWalletAuthMessage(account.address);
    const signature = await account.signMessage({ message });
    return {
      "x-wallet-address": account.address,
      "x-wallet-message": encodeWalletAuthHeaderMessage(message),
      "x-wallet-signature": signature,
    };
  };
}

describe("users API", () => {
  let memoryServer: MongoMemoryServer | undefined;

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = memoryServer.getUri();
    resetMongoConnectionForTests();
    resetUserServiceForTests();
    await connectMongo();
  }, 120_000);

  afterEach(async () => {
    resetWalletAuthStoreForTests();
    resetRateLimitsForTests();
    resetUserServiceForTests();
    resetRoleServiceForTests();
    resetMongoConnectionForTests();
    process.env.MONGODB_URI = memoryServer!.getUri();
    await connectMongo();
    await UserModel.deleteMany({});
    await RoleModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    resetMongoConnectionForTests();
    await memoryServer?.stop();
  });

  async function seedAdmin() {
    await seedApiSystemRoles();
    await UserModel.create({
      address: ADMIN_ADDRESS,
      roleSlug: "admin",
      status: "active",
    });
  }

  async function seedReader() {
    await seedApiSystemRoles();
    await UserModel.create({
      address: READER_ADDRESS,
      roleSlug: "reader",
      status: "active",
    });
  }

  it("GET rejects unsigned list requests", async () => {
    await seedAdmin();
    const response = await GET(new Request("http://localhost"));
    expect(response.status).toBe(403);
  });

  it("GET lists users for an admin signer", async () => {
    await seedAdmin();
    await seedReader();
    const headers = await authHeaders(ADMIN)();

    const response = await GET(
      new Request("http://localhost", { headers }),
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveLength(2);
  });

  it("POST creates a user with admin signature", async () => {
    await seedAdmin();
    const body = await signedPayload(ADMIN, {
      targetAddress: READER_ADDRESS,
      roleSlug: "author",
    });

    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.roleSlug).toBe("author");
  });

  it("GET user allows self-read with signature", async () => {
    await seedReader();
    const headers = await authHeaders(READER)();

    const response = await GET_USER(
      new Request("http://localhost", { headers }),
      { params: Promise.resolve({ address: READER_ADDRESS }) },
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.address).toBe(READER_ADDRESS);
  });

  it("PATCH rejects non-admin updates", async () => {
    await seedReader();
    const body = await signedPayload(READER, { roleSlug: "admin" });

    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ address: READER_ADDRESS }) },
    );

    expect(response.status).toBe(403);
  });

  it("DELETE removes a user for admin", async () => {
    await seedAdmin();
    await seedReader();
    const headers = await authHeaders(ADMIN)();

    const response = await DELETE(
      new Request("http://localhost", { headers }),
      { params: Promise.resolve({ address: READER_ADDRESS }) },
    );

    expect(response.status).toBe(200);
    expect(await UserModel.exists({ address: READER_ADDRESS })).toBeNull();
  });
});
