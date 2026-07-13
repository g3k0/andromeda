import { describe, expect, it } from "vitest";

import type { WorkUploadRecord } from "./types";
import {
  assertNoDuplicateWorkUpload,
  buildWorkEditionIdentity,
  findDuplicateWorkUpload,
  normalizeWorkTitle,
} from "./work-upload-duplicate";
import { WorkUploadDuplicateError } from "./errors";

const AUTHOR = "0x1111111111111111111111111111111111111111" as const;

function makeUpload(
  overrides: Partial<WorkUploadRecord> & Pick<WorkUploadRecord, "name" | "workImprint">,
): WorkUploadRecord {
  return {
    id: "upload-1",
    author: AUTHOR,
    metadataURI: "ipfs://bafy-meta",
    metadataCid: "bafy-meta",
    contentCid: "bafy-content",
    coverCid: "bafy-cover",
    externalUrl: null,
    status: "uploaded",
    workId: null,
    registeredAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("normalizeWorkTitle", () => {
  it("trims and lowercases titles", () => {
    expect(normalizeWorkTitle("  The Star Gate  ")).toBe("the star gate");
  });

  it("collapses internal whitespace", () => {
    expect(normalizeWorkTitle("The   Star   Gate")).toBe("the star gate");
  });
});

describe("buildWorkEditionIdentity", () => {
  it("identifies first editions", () => {
    expect(
      buildWorkEditionIdentity({
        publication_date: "2026-06-01",
        edition_number: 1,
        edition_kind: "first",
        back_cover_text: "Back",
        about_author: "About",
        author_address: AUTHOR,
      }),
    ).toBe("edition:1:first");
  });

  it("identifies reprints", () => {
    expect(
      buildWorkEditionIdentity({
        publication_date: "2026-06-01",
        edition_number: 1,
        edition_kind: "reprint",
        reprint_number: 2,
        back_cover_text: "Back",
        about_author: "About",
        author_address: AUTHOR,
      }),
    ).toBe("edition:1:reprint:2");
  });
});

describe("findDuplicateWorkUpload", () => {
  const firstEditionImprint = {
    publication_date: "2026-06-01",
    edition_number: 1,
    edition_kind: "first" as const,
    back_cover_text: "Back",
    about_author: "About",
    author_address: AUTHOR,
  };

  const existing = [
    makeUpload({
      name: "The Star Gate",
      workImprint: firstEditionImprint,
    }),
  ];

  it("returns null when no prior upload shares the title", () => {
    expect(
      findDuplicateWorkUpload(existing, {
        name: "Another Book",
        workImprint: firstEditionImprint,
      }),
    ).toBeNull();
  });

  it("rejects a second first edition with the same title", () => {
    expect(
      findDuplicateWorkUpload(existing, {
        name: "the star gate",
        workImprint: firstEditionImprint,
      }),
    ).toBe(existing[0]);
  });

  it("allows a reprint of the same title", () => {
    expect(
      findDuplicateWorkUpload(existing, {
        name: "The Star Gate",
        workImprint: {
          ...firstEditionImprint,
          edition_kind: "reprint",
          reprint_number: 1,
        },
      }),
    ).toBeNull();
  });

  it("rejects an identical reprint slot", () => {
    const reprintImprint = {
      ...firstEditionImprint,
      edition_kind: "reprint" as const,
      reprint_number: 1,
    };
    const withReprint = [
      ...existing,
      makeUpload({
        id: "upload-2",
        name: "The Star Gate",
        workImprint: reprintImprint,
      }),
    ];

    expect(
      findDuplicateWorkUpload(withReprint, {
        name: "The Star Gate",
        workImprint: reprintImprint,
      }),
    ).toBe(withReprint[1]);
  });
});

describe("assertNoDuplicateWorkUpload", () => {
  it("throws WorkUploadDuplicateError when a duplicate exists", () => {
    const imprint = {
      publication_date: "2026-06-01",
      edition_number: 1,
      edition_kind: "first" as const,
      back_cover_text: "Back",
      about_author: "About",
      author_address: AUTHOR,
    };

    expect(() =>
      assertNoDuplicateWorkUpload(
        [makeUpload({ name: "The Star Gate", workImprint: imprint })],
        { name: "The Star Gate", workImprint: imprint },
      ),
    ).toThrow(WorkUploadDuplicateError);
  });
});
