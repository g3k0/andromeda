import { describe, expect, it } from "vitest";

import { ForbiddenContentKeyError } from "./errors";
import { parseWorkUploadFiles } from "./upload-form";
import { parseWorkUploadFields } from "./upload-schemas";

const AUTHOR = "0x1111111111111111111111111111111111111111";

function createUploadFormData(
  extra: Record<string, string | Blob> = {},
): FormData {
  const formData = new FormData();
  formData.set(
    "walletAuth",
    JSON.stringify({
      address: AUTHOR,
      message: "Sign in to Andromeda",
      signature: `0x${"a".repeat(130)}`,
    }),
  );
  formData.set("name", "The Star Gate");
  formData.set("authorAddress", AUTHOR);
  formData.set("publicationDate", "2026-06-01");
  formData.set("editionNumber", "1");
  formData.set("editionKind", "first");
  formData.set("reprintNumber", "");
  formData.set("seriesName", "");
  formData.set("seriesVolume", "");
  formData.set("language", "");
  formData.set("originalPublicationDate", "");
  formData.set("backCoverText", "An encrypted novella about distant stars.");
  formData.set("aboutAuthor", "The author writes speculative fiction.");
  formData.set(
    "ciphertext",
    new Blob([new Uint8Array([1, 2, 3])], { type: "application/octet-stream" }),
  );
  formData.set(
    "coverImage",
    new Blob([new Uint8Array([4, 5, 6])], { type: "image/png" }),
  );

  for (const [key, value] of Object.entries(extra)) {
    formData.set(key, value);
  }

  return formData;
}

describe("parseWorkUploadFields", () => {
  it("parses required auth, imprint metadata, and text fields from walletAuth JSON", () => {
    const parsed = parseWorkUploadFields(createUploadFormData());
    expect(parsed.name).toBe("The Star Gate");
    expect(parsed.imprint.publication_date).toBe("2026-06-01");
    expect(parsed.imprint.author_address).toBe(AUTHOR);
  });

  it("rejects forbidden contentKey field", () => {
    expect(() =>
      parseWorkUploadFields(createUploadFormData({ contentKey: "secret" })),
    ).toThrow(ForbiddenContentKeyError);
  });

  it("rejects unsafe control characters in text fields", () => {
    const formData = createUploadFormData();
    formData.set("name", "Bad\u0007 title");

    expect(() => parseWorkUploadFields(formData)).toThrow();
  });

  it("rejects non-http external URLs", () => {
    const formData = createUploadFormData({
      externalUrl: "javascript:alert(1)",
    });

    expect(() => parseWorkUploadFields(formData)).toThrow();
  });

  it("rejects author address that does not match the signed wallet", () => {
    const formData = createUploadFormData({
      authorAddress: "0x2222222222222222222222222222222222222222",
    });

    expect(() => parseWorkUploadFields(formData)).toThrow();
  });
});

describe("parseWorkUploadFiles", () => {
  it("parses ciphertext and cover image files", async () => {
    const files = await parseWorkUploadFiles(createUploadFormData());
    expect(files.ciphertext).toEqual(new Uint8Array([1, 2, 3]));
    expect(files.coverMimeType).toBe("image/png");
  });

  it("rejects unsupported cover MIME types", async () => {
    const formData = createUploadFormData();
    formData.set(
      "coverImage",
      new Blob([new Uint8Array([1])], { type: "application/pdf" }),
    );

    await expect(parseWorkUploadFiles(formData)).rejects.toThrow(
      /Unsupported cover image MIME type/,
    );
  });
});
