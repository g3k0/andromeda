import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { WorkModel } from "@/lib/db/models/work.model";
import { connectMongo, resetMongoConnectionForTests } from "@/lib/db/mongodb";
import { createMongoIndexerRepositories } from "@/lib/works/adapters/create-indexer-repositories";

import { GET as listWorks } from "./route";
import { GET as getWork } from "./[workId]/route";

const AUTHOR = "0x1111111111111111111111111111111111111111";

async function seed() {
  const repos = await createMongoIndexerRepositories();
  await repos.works.upsertWork({
    workId: 1n,
    author: AUTHOR,
    metadataURI: "ipfs://one",
    price: 10n,
    maxCopies: 5n,
  });
  await repos.works.upsertWork({
    workId: 2n,
    author: AUTHOR,
    metadataURI: "ipfs://two",
    price: 20n,
    maxCopies: 0n,
    active: false,
  });
}

describe("works catalog API", () => {
  let memoryServer: MongoMemoryServer | undefined;

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = memoryServer.getUri();
    resetMongoConnectionForTests();
    await connectMongo();
  }, 120_000);

  afterEach(async () => {
    await WorkModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    resetMongoConnectionForTests();
    await memoryServer?.stop();
  });

  it("lists only active works without ciphertext or keys", async () => {
    await seed();
    const response = await listWorks();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.works).toHaveLength(1);
    expect(body.works[0].workId).toBe("1");
    expect(JSON.stringify(body)).not.toMatch(/contentKey|ciphertext|plaintext/i);
  });

  it("returns a work detail by id", async () => {
    await seed();
    const response = await getWork(new Request("http://localhost/api/works/2"), {
      params: Promise.resolve({ workId: "2" }),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.work.workId).toBe("2");
    expect(body.work.active).toBe(false);
  });

  it("returns 404 for an unknown work", async () => {
    const response = await getWork(
      new Request("http://localhost/api/works/99"),
      { params: Promise.resolve({ workId: "99" }) },
    );
    expect(response.status).toBe(404);
  });

  it("returns 400 for an invalid work id", async () => {
    const response = await getWork(
      new Request("http://localhost/api/works/abc"),
      { params: Promise.resolve({ workId: "abc" }) },
    );
    expect(response.status).toBe(400);
  });
});
