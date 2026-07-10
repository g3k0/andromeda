import { describe, expect, it } from "vitest";
import { createTranslateFn } from "@/lib/i18n/translate";
import { getAuthorAvatarUploadGuidance } from "@/lib/i18n/author-profile-messages";
import { AUTHOR_AVATAR_MAX_KB } from "./author-avatar-upload-guidance";

describe("author avatar upload guidance", () => {
  it("uses the database save limit as the maximum size", () => {
    expect(AUTHOR_AVATAR_MAX_KB).toBe(128);
  });

  it("describes allowed formats and a single size limit", () => {
    const guidance = getAuthorAvatarUploadGuidance(createTranslateFn("en"));

    expect(guidance).toContain("PNG, JPEG, WebP");
    expect(guidance).toContain("128 KB");
    expect(guidance).not.toContain("488");
    expect(guidance).not.toContain("database");
    expect(guidance).not.toContain("server");
  });
});
