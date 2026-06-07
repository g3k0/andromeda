import { describe, expect, it } from "vitest";
import { defaultUserPreferences } from "./types";
import type { User } from "./types";
import {
  getEffectivePermissions,
  hasPermission,
  ROLE_PERMISSIONS,
} from "./permissions";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

function buildUser(overrides: Partial<User> = {}): User {
  return {
    address: ADDRESS,
    role: "reader",
    status: "active",
    permissions: [],
    preferences: defaultUserPreferences(),
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("user permissions", () => {
  it("maps default permissions by role", () => {
    expect(getEffectivePermissions(buildUser({ role: "reader" }))).toEqual(
      ROLE_PERMISSIONS.reader,
    );
    expect(getEffectivePermissions(buildUser({ role: "author" }))).toEqual(
      ROLE_PERMISSIONS.author,
    );
    expect(getEffectivePermissions(buildUser({ role: "admin" }))).toEqual(
      ROLE_PERMISSIONS.admin,
    );
  });

  it("prefers explicit permissions over role defaults", () => {
    const user = buildUser({
      role: "reader",
      permissions: ["admin:access"],
    });
    expect(getEffectivePermissions(user)).toEqual(["admin:access"]);
  });

  it("checks permission membership", () => {
    const admin = buildUser({ role: "admin" });
    const reader = buildUser({ role: "reader" });

    expect(hasPermission(admin, "users:write")).toBe(true);
    expect(hasPermission(reader, "users:write")).toBe(false);
    expect(hasPermission(reader, "pages:read")).toBe(true);
  });
});
