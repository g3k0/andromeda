import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createAuthorProfile } from "./mock-store";
import {
  MemoryStorage,
  resetAuthorStoreStorage,
  setAuthorStoreStorage,
} from "./storage";
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
  it("returns invalid_address for malformed params", () => {
    expect(resolveAuthorPage("not-valid", () => profile)).toEqual({
      status: "invalid_address",
    });
  });

  it("returns not_found when lookup returns null", () => {
    expect(resolveAuthorPage(ADDRESS, () => null)).toEqual({
      status: "not_found",
      address: ADDRESS,
    });
  });

  it("returns ready with the profile when it exists", () => {
    expect(resolveAuthorPage(ADDRESS, () => profile)).toEqual({
      status: "ready",
      profile,
    });
  });

  it("normalizes address param before not_found response", () => {
    const upper = "0xABCDEF0123456789ABCDEF0123456789ABCDEF01";
    expect(resolveAuthorPage(upper, () => null)).toEqual({
      status: "not_found",
      address: ADDRESS,
    });
  });
});

describe("resolveAuthorPage with mock store", () => {
  beforeEach(() => {
    setAuthorStoreStorage(new MemoryStorage());
  });

  afterEach(() => {
    resetAuthorStoreStorage();
  });

  it("loads an existing profile from the mock store", () => {
    const created = createAuthorProfile(ADDRESS, { displayName: "Stored Author" });
    expect(resolveAuthorPage(ADDRESS)).toEqual({
      status: "ready",
      profile: created,
    });
  });
});
