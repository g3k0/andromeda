import { describe, expect, it } from "vitest";
import type { AuthorProfile } from "./types";
import { resolveAuthorPage } from "./author-page";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

const profile: AuthorProfile = {
  address: ADDRESS,
  displayName: "Jane Doe",
  avatarUrl: null,
  createdAt: "2026-06-03T12:00:00.000Z",
};

describe("resolveAuthorPage", () => {
  const lookup = () => profile;

  it("returns invalid_address for malformed params", async () => {
    await expect(resolveAuthorPage("not-valid", lookup)).resolves.toEqual({
      status: "invalid_address",
    });
  });

  it("returns not_found when lookup returns null", async () => {
    await expect(resolveAuthorPage(ADDRESS, () => null)).resolves.toEqual({
      status: "not_found",
      address: ADDRESS,
    });
  });

  it("returns ready with the profile when it exists", async () => {
    await expect(resolveAuthorPage(ADDRESS, () => profile)).resolves.toEqual({
      status: "ready",
      profile,
    });
  });

  it("normalizes address param before not_found response", async () => {
    const upper = "0xABCDEF0123456789ABCDEF0123456789ABCDEF01";
    await expect(resolveAuthorPage(upper, () => null)).resolves.toEqual({
      status: "not_found",
      address: ADDRESS,
    });
  });
});
