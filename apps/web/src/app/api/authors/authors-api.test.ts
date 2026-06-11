import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { createWalletAuthMessage } from "@/lib/auth/verify-wallet";
import { connectMongo, resetMongoConnectionForTests } from "@/lib/db/mongodb";
import { AuthorModel } from "@/lib/db/models/author.model";
import { RoleModel } from "@/lib/db/models/role.model";
import { UserModel } from "@/lib/db/models/user.model";
import { resetRoleServiceForTests } from "@/lib/roles/server";
import { seedApiSystemRoles } from "@/lib/testing/seed-api-roles";
import { RateLimitBucketModel } from "@/lib/db/models/rate-limit-bucket.model";
import { WalletPreferencesModel } from "@/lib/db/models/wallet-preferences.model";
import { resetAuthorServiceForTests } from "@/lib/authors/server";
import { resetUserServiceForTests } from "@/lib/users/server";
import { setAdminAddressesForTests } from "@/lib/auth/admin";
import {
  resetRateLimitsForTests,
  useInMemoryRateLimitsForTests,
} from "@/lib/auth/rate-limit";
import { resetWalletAuthStoreForTests } from "@/lib/auth/verify-wallet";
import { GET, PATCH } from "./[address]/route";
import { POST } from "./route";
import { PUT } from "../wallet-preferences/[address]/route";

const OWNER = privateKeyToAccount(generatePrivateKey());
const OTHER = privateKeyToAccount(generatePrivateKey());
const OWNER_ADDRESS = OWNER.address.toLowerCase();

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

describe("authors API", () => {
  let memoryServer: MongoMemoryServer | undefined;

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = memoryServer.getUri();
    resetMongoConnectionForTests();
    resetAuthorServiceForTests();
    resetUserServiceForTests();
    await seedApiSystemRoles();
  }, 120_000);

  beforeEach(() => {
    resetRateLimitsForTests();
    useInMemoryRateLimitsForTests();
  });

  afterEach(async () => {
    resetWalletAuthStoreForTests();
    resetRateLimitsForTests();
    useInMemoryRateLimitsForTests();
    await RateLimitBucketModel.deleteMany({});
    setAdminAddressesForTests(null);
    resetAuthorServiceForTests();
    resetUserServiceForTests();
    resetRoleServiceForTests();
    resetMongoConnectionForTests();
    process.env.MONGODB_URI = memoryServer!.getUri();
    await connectMongo();
    await AuthorModel.deleteMany({});
    await UserModel.deleteMany({});
    await RoleModel.deleteMany({});
    await WalletPreferencesModel.deleteMany({});
    await seedApiSystemRoles();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    resetMongoConnectionForTests();
    await memoryServer?.stop();
  });

  it("GET returns 404 when profile is missing", async () => {
    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ address: OWNER_ADDRESS }),
    });
    expect(response.status).toBe(404);
  });

  it("POST creates a profile with a valid signature", async () => {
    const body = await signedPayload(OWNER, { displayName: "Writer" });
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.displayName).toBe("Writer");

    const getResponse = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ address: OWNER_ADDRESS }),
    });
    expect(getResponse.status).toBe(200);
  });

  it("POST allows readers to create their own author profile during onboarding", async () => {
    await seedApiSystemRoles();
    await UserModel.create({
      address: OWNER_ADDRESS,
      roleSlug: "reader",
      status: "active",
    });

    const body = await signedPayload(OWNER, { displayName: "Writer" });
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json.displayName).toBe("Writer");
  });

  it("POST rejects readers when an author profile already exists", async () => {
    await seedApiSystemRoles();
    await UserModel.create({
      address: OWNER_ADDRESS,
      roleSlug: "reader",
      status: "active",
    });
    await AuthorModel.create({
      address: OWNER_ADDRESS,
      displayName: "Existing",
      avatarUrl: null,
      createdAt: new Date(),
    });

    const body = await signedPayload(OWNER, { displayName: "Writer" });
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
    );

    expect(response.status).toBe(403);
  });

  it("POST rejects unsigned mutations", async () => {
    const response = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: OWNER_ADDRESS, displayName: "X" }),
      }),
    );
    expect(response.status).toBe(422);
  });

  it("PATCH rejects signatures from another wallet", async () => {
    const createBody = await signedPayload(OWNER, { displayName: "Writer" });
    await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(createBody),
      }),
    );

    const patchBody = await signedPayload(OTHER, {
      displayName: "Hijacked",
      avatarUrl: null,
    });
    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patchBody),
      }),
      { params: Promise.resolve({ address: OWNER_ADDRESS }) },
    );

    expect(response.status).toBe(403);
  });

  it("PATCH rejects malicious avatar payloads", async () => {
    const createBody = await signedPayload(OWNER, { displayName: "Writer" });
    await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(createBody),
      }),
    );

    const patchBody = await signedPayload(OWNER, {
      displayName: "Writer",
      avatarUrl: "javascript:alert(1)",
    });
    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patchBody),
      }),
      { params: Promise.resolve({ address: OWNER_ADDRESS }) },
    );

    expect(response.status).toBe(422);
  });

  it("returns 429 when mutation rate limit is exceeded", async () => {
    await seedApiSystemRoles();
    process.env.TRUST_PROXY = "true";
    const request = async () => {
      const body = await signedPayload(OWNER, { displayName: "Writer" });
      return POST(
        new Request("http://localhost", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "203.0.113.10",
          },
          body: JSON.stringify(body),
        }),
      );
    };

    for (let attempt = 0; attempt < 30; attempt += 1) {
      const response = await request();
      expect([201, 409]).toContain(response.status);
    }

    const limited = await request();
    expect(limited.status).toBe(429);
    delete process.env.TRUST_PROXY;
  });

  it("PATCH allows verified admin signatures on another profile", async () => {
    const ADMIN = privateKeyToAccount(generatePrivateKey());

    await UserModel.create({
      address: ADMIN.address.toLowerCase(),
      roleSlug: "admin",
      status: "active",
      permissionOverrides: [],
      preferences: { declinedAuthorPage: false },
    });

    const createBody = await signedPayload(OWNER, { displayName: "Writer" });
    const createResponse = await POST(
      new Request("http://localhost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(createBody),
      }),
    );
    expect([201, 409]).toContain(createResponse.status);

    const patchBody = await signedPayload(ADMIN, {
      displayName: "Curated by admin",
      avatarUrl: null,
    });
    const response = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patchBody),
      }),
      { params: Promise.resolve({ address: OWNER_ADDRESS }) },
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.displayName).toBe("Curated by admin");
  });

  it("PUT stores wallet preferences for the signer only", async () => {
    const body = await signedPayload(OWNER, { declinedAuthorPage: true });
    const response = await PUT(
      new Request("http://localhost", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ address: OWNER_ADDRESS }) },
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.declinedAuthorPage).toBe(true);
  });
});
