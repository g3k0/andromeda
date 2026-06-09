import { describe, expect, it } from "vitest";
import type { Role } from "@/lib/roles/types";
import { defaultUserPreferences } from "./types";
import type { User } from "./types";
import { getEffectivePermissions, hasPermission } from "./permissions";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

const readerRole: Role = {
  slug: "reader",
  name: "Reader",
  description: null,
  permissions: ["pages:read"],
  isSystem: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const adminRole: Role = {
  slug: "admin",
  name: "Admin",
  description: null,
  permissions: ["pages:read", "users:write", "admin:access"],
  isSystem: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function buildUser(overrides: Partial<User> = {}): User {
  return {
    address: ADDRESS,
    roleSlug: "reader",
    status: "active",
    permissionOverrides: [],
    preferences: defaultUserPreferences(),
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("user permissions", () => {
  it("merges role permissions with user overrides", () => {
    expect(getEffectivePermissions(buildUser(), readerRole)).toEqual([
      "pages:read",
    ]);
    expect(
      getEffectivePermissions(
        buildUser({ permissionOverrides: ["admin:access"] }),
        readerRole,
      ),
    ).toEqual(["pages:read", "admin:access"]);
  });

  it("checks permission membership", () => {
    const admin = {
      permissions: getEffectivePermissions(buildUser({ roleSlug: "admin" }), adminRole),
    };
    const reader = {
      permissions: getEffectivePermissions(buildUser(), readerRole),
    };

    expect(hasPermission(admin, "users:write")).toBe(true);
    expect(hasPermission(reader, "users:write")).toBe(false);
    expect(hasPermission(reader, "pages:read")).toBe(true);
  });
});
