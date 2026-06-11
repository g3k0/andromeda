import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { connectMongo, resetMongoConnectionForTests } from "@/lib/db/mongodb";
import { WalletAuthNonceModel } from "@/lib/db/models/wallet-auth-nonce.model";
import { MongoWalletAuthNonceStore } from "./mongo-wallet-auth-nonce-store";

describe("MongoWalletAuthNonceStore", () => {
  let memoryServer: MongoMemoryServer | undefined;
  let store: MongoWalletAuthNonceStore;

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = memoryServer.getUri();
    resetMongoConnectionForTests();
    await connectMongo();
    store = new MongoWalletAuthNonceStore();
  }, 120_000);

  afterEach(async () => {
    await WalletAuthNonceModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    resetMongoConnectionForTests();
    await memoryServer?.stop();
  });

  it("rejects replayed nonces across separate store instances", async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    await store.put({
      nonce: "nonce-1",
      address: "0xabcdef0123456789abcdef0123456789abcdef01",
      expiresAt,
      used: false,
    });

    const secondStore = new MongoWalletAuthNonceStore();
    const now = new Date();

    await expect(
      store.consumeIfValid(
        "nonce-1",
        "0xabcdef0123456789abcdef0123456789abcdef01",
        now,
      ),
    ).resolves.toBe(true);
    await expect(
      secondStore.consumeIfValid(
        "nonce-1",
        "0xabcdef0123456789abcdef0123456789abcdef01",
        now,
      ),
    ).resolves.toBe(false);
  });
});
