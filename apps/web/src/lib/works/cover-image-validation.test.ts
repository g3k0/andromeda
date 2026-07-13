import { describe, expect, it } from "vitest";

import {
  MINIMAL_PNG_BYTES,
  assertCoverImageBytesMatchMime,
} from "./cover-image-validation";

describe("assertCoverImageBytesMatchMime", () => {
  it("accepts a valid PNG", () => {
    expect(() =>
      assertCoverImageBytesMatchMime(MINIMAL_PNG_BYTES, "image/png"),
    ).not.toThrow();
  });

  it("accepts JPEG magic bytes", () => {
    expect(() =>
      assertCoverImageBytesMatchMime(
        new Uint8Array([0xff, 0xd8, 0xff, 0x00]),
        "image/jpeg",
      ),
    ).not.toThrow();
  });

  it("accepts WebP magic bytes", () => {
    const bytes = new Uint8Array(12);
    bytes.set([0x52, 0x49, 0x46, 0x46], 0);
    bytes.set([0x57, 0x45, 0x42, 0x50], 8);

    expect(() =>
      assertCoverImageBytesMatchMime(bytes, "image/webp"),
    ).not.toThrow();
  });

  it("rejects PNG MIME with non-image bytes", () => {
    expect(() =>
      assertCoverImageBytesMatchMime(new Uint8Array([9, 8, 7]), "image/png"),
    ).toThrow(/Cover image content does not match/);
  });
});
