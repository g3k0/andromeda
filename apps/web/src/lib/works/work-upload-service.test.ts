import { describe, expect, it, beforeEach } from "vitest";

import { createWorkUploadService } from "./work-upload-service";
import { InMemoryWorkUploadRepository } from "./testing/in-memory-work-upload-repository";

const AUTHOR = "0x1111111111111111111111111111111111111111";

const IMPRINT = {
  publication_date: "2026-06-01",
  edition_number: 1,
  edition_kind: "first" as const,
  back_cover_text: "Back cover",
  about_author: "About author",
  author_address: AUTHOR,
};

describe("work upload service", () => {
  let repository: InMemoryWorkUploadRepository;

  beforeEach(() => {
    repository = new InMemoryWorkUploadRepository();
  });

  it("creates uploads and lists them newest first for an author", async () => {
    const service = createWorkUploadService(repository);

    await service.createUpload({
      author: AUTHOR,
      name: "First",
      metadataURI: "ipfs://one",
      metadataCid: "cid-one",
      contentCid: "content-one",
      coverCid: "cover-one",
      workImprint: IMPRINT,
    });
    await service.createUpload({
      author: AUTHOR,
      name: "Second",
      metadataURI: "ipfs://two",
      metadataCid: "cid-two",
      contentCid: "content-two",
      coverCid: "cover-two",
      workImprint: IMPRINT,
    });

    const uploads = await service.listByAuthor(AUTHOR);
    expect(uploads.map((upload) => upload.name)).toEqual(["Second", "First"]);
  });
});
