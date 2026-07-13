import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { WorkUploadModel } from "@/lib/db/models/work-upload.model";
import { connectMongo, resetMongoConnectionForTests } from "@/lib/db/mongodb";
import { WorkUploadMetadataExistsError } from "@/lib/works/errors";
import { MongoWorkUploadRepository } from "@/lib/works/adapters/mongo-work-upload-repository";

const AUTHOR = "0x1111111111111111111111111111111111111111";

const IMPRINT = {
  publication_date: "2026-06-01",
  edition_number: 1,
  edition_kind: "first" as const,
  back_cover_text: "Back cover",
  about_author: "About author",
  author_address: AUTHOR,
};

const BASE_INPUT = {
  author: AUTHOR,
  name: "The Star Gate",
  metadataURI: "ipfs://bafy-meta",
  metadataCid: "bafy-meta",
  contentCid: "bafy-content",
  coverCid: "bafy-cover",
  workImprint: IMPRINT,
};

describe("MongoWorkUploadRepository", () => {
  let memoryServer: MongoMemoryServer | undefined;
  let repository: MongoWorkUploadRepository;

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = memoryServer.getUri();
    resetMongoConnectionForTests();
  }, 120_000);

  beforeEach(async () => {
    resetMongoConnectionForTests();
    process.env.MONGODB_URI = memoryServer!.getUri();
    await connectMongo();
    repository = new MongoWorkUploadRepository();
  });

  afterEach(async () => {
    await WorkUploadModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    resetMongoConnectionForTests();
    await memoryServer?.stop();
  });

  it("creates and lists uploads by author", async () => {
    const created = await repository.create(BASE_INPUT);
    expect(created.author.toLowerCase()).toBe(AUTHOR);
    expect(created.status).toBe("uploaded");

    const listed = await repository.listByAuthor(AUTHOR);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.metadataCid).toBe("bafy-meta");
  });

  it("rejects duplicate metadata CIDs", async () => {
    await repository.create(BASE_INPUT);
    await expect(repository.create(BASE_INPUT)).rejects.toBeInstanceOf(
      WorkUploadMetadataExistsError,
    );
  });

  it("marks an upload as registered by metadata URI", async () => {
    const created = await repository.create(BASE_INPUT);
    const registered = await repository.markRegistered(
      created.metadataURI,
      "42",
    );

    expect(registered?.status).toBe("registered");
    expect(registered?.workId).toBe("42");
    expect(registered?.registeredAt).not.toBeNull();
  });
});
