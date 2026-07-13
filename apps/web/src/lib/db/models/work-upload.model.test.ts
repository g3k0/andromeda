import { describe, expect, it } from "vitest";

import {
  WORK_UPLOAD_COLLECTION_NAME,
  WorkUploadModel,
} from "./work-upload.model";

describe("work upload model", () => {
  it("uses the work_uploads collection name", () => {
    expect(WORK_UPLOAD_COLLECTION_NAME).toBe("work_uploads");
    expect(WorkUploadModel.collection.name).toBe("work_uploads");
  });

  it("requires core upload metadata fields", () => {
    const error = new WorkUploadModel({}).validateSync();
    expect(error?.errors.author).toBeDefined();
    expect(error?.errors.name).toBeDefined();
    expect(error?.errors.metadataURI).toBeDefined();
    expect(error?.errors.metadataCid).toBeDefined();
    expect(error?.errors.contentCid).toBeDefined();
    expect(error?.errors.coverCid).toBeDefined();
    expect(error?.errors.workImprint).toBeDefined();
  });

  it("defaults upload status to uploaded", () => {
    const upload = new WorkUploadModel({
      author: "0xabcdef0123456789abcdef0123456789abcdef01",
      name: "The Star Gate",
      metadataURI: "ipfs://meta",
      metadataCid: "bafy-meta",
      contentCid: "bafy-content",
      coverCid: "bafy-cover",
      workImprint: {
        publication_date: "2026-06-01",
        edition_number: 1,
        edition_kind: "first",
        back_cover_text: "Back cover",
        about_author: "About author",
        author_address: "0xabcdef0123456789abcdef0123456789abcdef01",
      },
    });

    expect(upload.status).toBe("uploaded");
    expect(upload.author).toBe("0xabcdef0123456789abcdef0123456789abcdef01");
  });

  it("declares author and metadata lookup indexes", () => {
    const indexes = WorkUploadModel.schema.indexes();
    const flattened = JSON.stringify(indexes);

    expect(flattened).toContain("author");
    expect(flattened).toContain("metadataCid");
    expect(flattened).toContain("metadataURI");
  });
});
