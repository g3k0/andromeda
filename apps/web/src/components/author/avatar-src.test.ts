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

  it("maps ipfs URLs to the public gateway", () => {
    expect(resolveAuthorAvatarSrc("  ipfs://avatar  ")).toBe(
      "https://ipfs.io/ipfs/avatar",
    );
  });

  it("returns https URLs unchanged", () => {
    expect(resolveAuthorAvatarSrc("https://cdn.example/avatar.png")).toBe(
      "https://cdn.example/avatar.png",
    );
  });
});
