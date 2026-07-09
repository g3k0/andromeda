import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { TokenModel } from "@/lib/db/models/token.model";
import { connectMongo, resetMongoConnectionForTests } from "@/lib/db/mongodb";
import { createMongoIndexerRepositories } from "@/lib/works/adapters/create-indexer-repositories";

import { GET as getLibrary } from "./[owner]/route";

const OWNER = "0x2222222222222222222222222222222222222222";

describe("library API", () => {
  let memoryServer: MongoMemoryServer | undefined;

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = memoryServer.getUri();
    resetMongoConnectionForTests();
    await connectMongo();
  }, 120_000);

  afterEach(async () => {
    await TokenModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    resetMongoConnectionForTests();
    await memoryServer?.stop();
  });

  it("returns the copies owned by an address", async () => {
    const repos = await createMongoIndexerRepositories();
    await repos.tokens.upsertToken({
      tokenId: 1n,
      workId: 7n,
      owner: OWNER,
      copyNumber: 1,
    });

    const response = await getLibrary(
      new Request(`http://localhost/api/library/${OWNER}`),
      { params: Promise.resolve({ owner: OWNER }) },
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.copies).toHaveLength(1);
    expect(body.copies[0].tokenId).toBe("1");
  });

  it("returns 400 for a malformed owner address", async () => {
    const response = await getLibrary(
      new Request("http://localhost/api/library/0x123"),
      { params: Promise.resolve({ owner: "0x123" }) },
    );
    expect(response.status).toBe(400);
  });
});
