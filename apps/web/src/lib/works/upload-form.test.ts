import { describe, expect, it } from "vitest";

import { ForbiddenContentKeyError } from "./errors";
import { parseWorkUploadFiles } from "./upload-form";
import { parseWorkUploadFields } from "./upload-schemas";

function createUploadFormData(
  extra: Record<string, string | Blob> = {},
): FormData {
  const formData = new FormData();
  formData.set(
    "walletAuth",
    JSON.stringify({
      address: "0x1111111111111111111111111111111111111111",
      message: "Sign in to Andromeda",
      signature: `0x${"a".repeat(130)}`,
    }),
  );
  formData.set("name", "The Star Gate");
  formData.set("description", "Encrypted novella.");
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
  it("parses required auth and text fields from walletAuth JSON", () => {
    const parsed = parseWorkUploadFields(createUploadFormData());
    expect(parsed.name).toBe("The Star Gate");
    expect(parsed.description).toBe("Encrypted novella.");
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
