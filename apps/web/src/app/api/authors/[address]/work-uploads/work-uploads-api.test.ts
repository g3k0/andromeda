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

import { AuthorModel } from "@/lib/db/models/author.model";
import { WorkUploadModel } from "@/lib/db/models/work-upload.model";
import { connectMongo, resetMongoConnectionForTests } from "@/lib/db/mongodb";
import { resetAuthorServiceForTests } from "@/lib/authors/server";
import { resetWorkUploadServiceForTests } from "@/lib/works/work-upload-server";

import { GET } from "./route";

const AUTHOR = "0xabcdef0123456789abcdef0123456789abcdef01";

describe("author work uploads API", () => {
  let memoryServer: MongoMemoryServer | undefined;

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = memoryServer.getUri();
    resetMongoConnectionForTests();
  }, 120_000);

  beforeEach(async () => {
    resetWorkUploadServiceForTests();
    resetAuthorServiceForTests();
    resetMongoConnectionForTests();
    process.env.MONGODB_URI = memoryServer!.getUri();
    await connectMongo();
  });

  afterEach(async () => {
    resetWorkUploadServiceForTests();
    resetAuthorServiceForTests();
    resetMongoConnectionForTests();
    process.env.MONGODB_URI = memoryServer!.getUri();
    await connectMongo();
    await AuthorModel.deleteMany({});
    await WorkUploadModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    resetMongoConnectionForTests();
    await memoryServer?.stop();
  });

  it("returns 404 when the author profile is missing", async () => {
    const response = await GET(
      new Request("http://localhost/api/authors/0x123/work-uploads"),
      { params: Promise.resolve({ address: AUTHOR }) },
    );

    expect(response.status).toBe(404);
  });

  it("lists persisted uploads for an author", async () => {
    await AuthorModel.create({
      address: AUTHOR,
      displayName: "Writer",
      avatarUrl: null,
    });
    await WorkUploadModel.create({
      author: AUTHOR,
      name: "The Star Gate",
      metadataURI: "ipfs://bafy-meta",
      metadataCid: "bafy-meta",
      contentCid: "bafy-content",
      coverCid: "bafy-cover",
      workImprint: {
        publication_date: "2026-06-01",
        edition_number: 1,
        edition_kind: "first",
        back_cover_text: "Back cover",
        about_author: "About author",
        author_address: AUTHOR,
      },
    });

    const response = await GET(
      new Request("http://localhost/api/authors/0x123/work-uploads"),
      { params: Promise.resolve({ address: AUTHOR }) },
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toHaveLength(1);
    expect(json[0].author.toLowerCase()).toBe(AUTHOR.toLowerCase());
    expect(json[0].metadataCid).toBe("bafy-meta");
  });
});
