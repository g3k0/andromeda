import { describe, expect, it } from "vitest";
import { AUTHOR_AVATAR_PLACEHOLDER_PATH } from "./constants";
import { resolveAuthorAvatarSrc } from "./avatar-src";

describe("resolveAuthorAvatarSrc", () => {
  it("returns the placeholder when avatarUrl is null", () => {
    expect(resolveAuthorAvatarSrc(null)).toBe(AUTHOR_AVATAR_PLACEHOLDER_PATH);
  });

  it("returns the placeholder for empty or whitespace-only values", () => {
    expect(resolveAuthorAvatarSrc("")).toBe(AUTHOR_AVATAR_PLACEHOLDER_PATH);
    expect(resolveAuthorAvatarSrc("   ")).toBe(AUTHOR_AVATAR_PLACEHOLDER_PATH);
  });

  it("returns a trimmed custom avatar URL", () => {
    expect(resolveAuthorAvatarSrc("  ipfs://avatar  ")).toBe("ipfs://avatar");
  });
});
