import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createWalletAuthMessage } from "@/lib/auth/verify-wallet";
import { resetMongoConnectionForTests } from "@/lib/db/mongodb";
import { AuthorModel } from "@/lib/db/models/author.model";
import { WalletPreferencesModel } from "@/lib/db/models/wallet-preferences.model";
import { resetAuthorServiceForTests } from "@/lib/authors/server";
import { resetRateLimitsForTests } from "@/lib/auth/rate-limit";
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
  const { message } = createWalletAuthMessage(account.address);
  const signature = await account.signMessage({ message });
  return {
    address: account.address,
    message,
    signature,
    ...extra,
  };
}

describe("authors API", () => {
  let memoryServer: MongoMemoryServer;

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = memoryServer.getUri();
    resetMongoConnectionForTests();
    resetAuthorServiceForTests();
  });

  afterEach(async () => {
    await AuthorModel.deleteMany({});
    await WalletPreferencesModel.deleteMany({});
    resetWalletAuthStoreForTests();
    resetRateLimitsForTests();
    resetAuthorServiceForTests();
    resetMongoConnectionForTests();
    process.env.MONGODB_URI = memoryServer.getUri();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    resetMongoConnectionForTests();
    await memoryServer.stop();
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
