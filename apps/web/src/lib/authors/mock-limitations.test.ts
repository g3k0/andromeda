import { describe, expect, it } from "vitest";
import {
  FUTURE_DATABASE_MIGRATION,
  MOCK_PERSISTENCE_LIMITATIONS,
  USER_ROLE_DEFINITIONS,
  getAuthorMockStorageKeys,
  getUserRoleDefinition,
  usesBrowserLocalStorageForMock,
} from "./mock-limitations";
import {
  AUTHORS_RECORD_STORAGE_KEY,
  walletPreferencesStorageKey,
} from "./storage-keys";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

describe("author mock limitations", () => {
  it("documents all three user roles", () => {
    expect(USER_ROLE_DEFINITIONS.map((entry) => entry.role)).toEqual([
      "reader",
      "author",
      "admin",
    ]);
  });

  it("describes admin capabilities for cross-profile editing", () => {
    const admin = getUserRoleDefinition("admin");
    expect(admin.canEditAnyAuthorPage).toBe(true);
    expect(admin.canAccessAdminArea).toBe(true);
  });

  it("describes author capabilities without admin access", () => {
    const author = getUserRoleDefinition("author");
    expect(author.canEditOwnAuthorPage).toBe(true);
    expect(author.canEditAnyAuthorPage).toBe(false);
    expect(author.canAccessAdminArea).toBe(false);
  });

  it("lists mock persistence limitations", () => {
    expect(MOCK_PERSISTENCE_LIMITATIONS.length).toBeGreaterThanOrEqual(4);
    expect(MOCK_PERSISTENCE_LIMITATIONS.join(" ")).toContain("localStorage");
  });

  it("exposes storage keys aligned with the mock store", () => {
    const keys = getAuthorMockStorageKeys();
    expect(keys.authorsRecord).toBe(AUTHORS_RECORD_STORAGE_KEY);
    expect(keys.walletPreferencesFor(ADDRESS)).toBe(
      walletPreferencesStorageKey(ADDRESS),
    );
  });

  it("documents the future database migration surface", () => {
    expect(FUTURE_DATABASE_MIGRATION.tables.authors).toContain("address");
    expect(FUTURE_DATABASE_MIGRATION.api.patchAuthor).toBe(
      "PATCH /authors/:address",
    );
    expect(FUTURE_DATABASE_MIGRATION.modulesToReplace).toContain("mock-store.ts");
    expect(FUTURE_DATABASE_MIGRATION.modulesToKeep).toContain("roles.ts");
  });

  it("detects browser localStorage availability", () => {
    expect(usesBrowserLocalStorageForMock()).toBe(false);
  });

  it("throws for unknown roles", () => {
    expect(() => getUserRoleDefinition("unknown" as "admin")).toThrow(
      "Unknown user role",
    );
  });
});
