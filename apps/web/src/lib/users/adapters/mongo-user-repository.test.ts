import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { UserModel } from "@/lib/db/models/user.model";
import { resetMongoConnectionForTests } from "@/lib/db/mongodb";
import { createMongoUserRepository } from "./create-user-repository";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

describe("mongo user repository", () => {
  let memoryServer: MongoMemoryServer;

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = memoryServer.getUri();
    resetMongoConnectionForTests();
  });

  afterEach(async () => {
    await UserModel.deleteMany({});
    resetMongoConnectionForTests();
    process.env.MONGODB_URI = memoryServer.getUri();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    resetMongoConnectionForTests();
    await memoryServer.stop();
  });

  it("persists users with preferences and metadata", async () => {
    const repository = await createMongoUserRepository();

    const created = await repository.create({
      address: ADDRESS,
      role: "author",
      preferences: { declinedAuthorPage: true },
      metadata: { source: "test" },
    });

    expect(created.role).toBe("author");
    expect(created.preferences.declinedAuthorPage).toBe(true);
    expect(created.metadata).toEqual({ source: "test" });

    const updated = await repository.update({
      ...created,
      role: "admin",
    });
    expect(updated.role).toBe("admin");
    expect(await repository.list({ role: "admin" })).toEqual([updated]);
  });
});
