import { describe, expect, it } from "vitest";
import {
  DATABASE_MIGRATION_STATUS,
  DATABASE_PERSISTENCE_NOTES,
  USER_ROLE_DEFINITIONS,
  getUserRoleDefinition,
} from "./mock-limitations";

describe("author database limitations", () => {
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

  it("lists database persistence notes", () => {
    expect(DATABASE_PERSISTENCE_NOTES.length).toBeGreaterThanOrEqual(4);
    expect(DATABASE_PERSISTENCE_NOTES.join(" ")).toContain("MongoDB");
  });

  it("documents the implemented database API surface", () => {
    expect(DATABASE_MIGRATION_STATUS.collections.authors).toContain("address");
    expect(DATABASE_MIGRATION_STATUS.api.patchAuthor).toBe(
      "PATCH /api/authors/:address",
    );
    expect(DATABASE_MIGRATION_STATUS.modulesToKeep).toContain("roles.ts");
  });

  it("throws for unknown roles", () => {
    expect(() => getUserRoleDefinition("unknown" as "admin")).toThrow(
      "Unknown user role",
    );
  });
});
