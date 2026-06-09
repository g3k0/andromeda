import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createWalletAuthMessage } from "@/lib/auth/verify-wallet";
import { WALLET_SESSION_COOKIE_NAME } from "@/lib/auth/wallet-session-cookies";
import { resetWalletSessionServiceForTests } from "@/lib/auth/wallet-session-server";
import { connectMongo, resetMongoConnectionForTests } from "@/lib/db/mongodb";
import { RoleModel } from "@/lib/db/models/role.model";
import { UserModel } from "@/lib/db/models/user.model";
import { resetRoleServiceForTests } from "@/lib/roles/server";
import { seedApiSystemRoles } from "@/lib/testing/seed-api-roles";
import { WalletSessionModel } from "@/lib/db/models/wallet-session.model";
import { resetRateLimitsForTests } from "@/lib/auth/rate-limit";
import { resetWalletAuthStoreForTests } from "@/lib/auth/verify-wallet";
import { resetUserServiceForTests } from "@/lib/users/server";
import { DELETE, POST } from "./route";
import { GET as GET_STATUS } from "./status/route";
import { GET, POST as POST_USERS } from "@/app/api/users/route";

const ADMIN = privateKeyToAccount(generatePrivateKey());
const READER = privateKeyToAccount(generatePrivateKey());
const ADMIN_ADDRESS = ADMIN.address.toLowerCase();

async function signedPayload(account: ReturnType<typeof privateKeyToAccount>) {
  const { message } = createWalletAuthMessage(account.address);
  const signature = await account.signMessage({ message });
  return { address: account.address, message, signature };
}

describe("wallet session API", () => {
  let memoryServer: MongoMemoryServer;

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = memoryServer.getUri();
    resetMongoConnectionForTests();
    resetUserServiceForTests();
    resetWalletSessionServiceForTests();
    await connectMongo();
  });

  afterEach(async () => {
    resetWalletAuthStoreForTests();
    resetRateLimitsForTests();
    resetUserServiceForTests();
    resetRoleServiceForTests();
    resetWalletSessionServiceForTests();
    resetMongoConnectionForTests();
    process.env.MONGODB_URI = memoryServer.getUri();
    await connectMongo();
    await UserModel.deleteMany({});
    await RoleModel.deleteMany({});
    await WalletSessionModel.deleteMany({});
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

  async function seedReader() {
    await seedApiSystemRoles();
    await UserModel.create({
      address: READER.address.toLowerCase(),
      roleSlug: "reader",
      status: "active",
    });
  }

  it("establishes an admin session and lists users with the session cookie", async () => {
    await seedAdmin();
    await seedReader();

    const establishResponse = await POST(
      new Request("http://localhost/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(await signedPayload(ADMIN)),
      }),
    );

    expect(establishResponse.status).toBe(200);
    const cookie = establishResponse.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(WALLET_SESSION_COOKIE_NAME);

    const statusResponse = await GET_STATUS(
      new Request("http://localhost/api/auth/session/status", {
        headers: { cookie },
      }),
    );
    expect(statusResponse.status).toBe(200);
    await expect(statusResponse.json()).resolves.toEqual({
      active: true,
      expiresAt: expect.any(String),
    });

    const listResponse = await GET(
      new Request("http://localhost/api/users", {
        headers: { cookie },
      }),
    );
    expect(listResponse.status).toBe(200);
    const users = await listResponse.json();
    expect(users).toHaveLength(2);
  });

  it("rejects session establishment for non-admin users", async () => {
    await seedReader();
    const response = await POST(
      new Request("http://localhost/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(await signedPayload(READER)),
      }),
    );
    expect(response.status).toBe(403);
  });

  it("revokes the active session", async () => {
    await seedAdmin();
    const establishResponse = await POST(
      new Request("http://localhost/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(await signedPayload(ADMIN)),
      }),
    );
    const cookie = establishResponse.headers.get("set-cookie") ?? "";

    const revokeResponse = await DELETE(
      new Request("http://localhost/api/auth/session", {
        headers: { cookie },
      }),
    );
    expect(revokeResponse.status).toBe(200);

    const listResponse = await GET(
      new Request("http://localhost/api/users", {
        headers: { cookie },
      }),
    );
    expect(listResponse.status).toBe(403);
  });
});
