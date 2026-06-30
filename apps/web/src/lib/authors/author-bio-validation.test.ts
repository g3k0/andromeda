import { describe, expect, it } from "vitest";
import { AUTHOR_BIO_MAX_LENGTH } from "./field-limits";
import {
  containsUnsafeBioControlCharacters,
  normalizeAuthorBioForSave,
  sanitizeBioInput,
  validateAuthorBio,
} from "./author-bio-validation";

describe("author bio validation", () => {
  it("treats blank bio as optional", () => {
    expect(validateAuthorBio("")).toBeNull();
    expect(validateAuthorBio("   ")).toBeNull();
    expect(normalizeAuthorBioForSave("   ")).toBeNull();
  });

  it("rejects oversized and unsafe bio values", () => {
    expect(validateAuthorBio("a".repeat(AUTHOR_BIO_MAX_LENGTH + 1))).toBe(
      `Bio must be ${AUTHOR_BIO_MAX_LENGTH} characters or fewer.`,
    );
    expect(validateAuthorBio("Hello\u0007")).toBe("Bio contains invalid characters.");
    expect(containsUnsafeBioControlCharacters("Hello\u0007")).toBe(true);
  });

  it("accepts multiline bio text", () => {
    expect(validateAuthorBio("Line one\nLine two")).toBeNull();
    expect(normalizeAuthorBioForSave("  Line one\nLine two  ")).toBe(
      "Line one\nLine two",
    );
  });

  it("sanitizes unsafe control characters from input", () => {
    expect(sanitizeBioInput("Safe\u0007 text")).toBe("Safe text");
  });
});
