import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { AuthorModel } from "@/lib/db/models/author.model";
import { WalletPreferencesModel } from "@/lib/db/models/wallet-preferences.model";
import { resetMongoConnectionForTests } from "@/lib/db/mongodb";
import { createAuthorService } from "../author-service";
import { createMongoAuthorRepositories } from "./create-repositories";

const VALID = "0xabcdef0123456789abcdef0123456789abcdef01";

describe("mongo repository adapters", () => {
  let memoryServer: MongoMemoryServer;

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = memoryServer.getUri();
    resetMongoConnectionForTests();
  });

  afterEach(async () => {
    await AuthorModel.deleteMany({});
    await WalletPreferencesModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    resetMongoConnectionForTests();
    await memoryServer.stop();
  });

  it("persists author profiles and preferences", async () => {
    const repositories = await createMongoAuthorRepositories();
    const service = createAuthorService(repositories);

    const profile = await service.createAuthorProfile(VALID, {
      displayName: "Writer",
    });
    expect(profile.displayName).toBe("Writer");

    const updated = await service.upsertAuthor({
      ...profile,
      displayName: "Updated",
      avatarUrl: null,
    });
    expect(updated.displayName).toBe("Updated");
    expect(await service.getAuthorByAddress(VALID)).toEqual(updated);

    await service.setWalletPreferences(VALID, { declinedAuthorPage: true });
    expect(await service.getWalletPreferences(VALID)).toEqual({
      declinedAuthorPage: true,
    });
  });
});
