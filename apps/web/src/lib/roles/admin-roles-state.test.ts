import { describe, expect, it } from "vitest";
import { createTranslateFn } from "@/lib/i18n/translate";
import type { UserPermission } from "@/lib/users/types";
import type { RoleWithUserCount } from "./types";
import {
  buildCreateRolePayload,
  buildUpdateRolePayload,
  canDeleteRole,
  createDefaultCreateRoleFormState,
  roleDeleteBlockedReason,
  isAdminRoleRowDirty,
  syncAdminRowsFromRoles,
  toggleRoleDraftPermission,
  validateCreateRoleForm,
} from "./admin-roles-state";

const t = createTranslateFn("en");

const role: RoleWithUserCount = {
  slug: "moderator",
  name: "Moderator",
  description: "Reviews content",
  permissions: ["pages:read"] satisfies UserPermission[],
  isSystem: false,
  userCount: 2,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("admin roles state", () => {
  it("syncs rows and drafts from roles", () => {
    const synced = syncAdminRowsFromRoles([role]);
    expect(synced.rows).toHaveLength(1);
    expect(synced.drafts[0]?.slug).toBe("moderator");
  });

  it("detects dirty role drafts", () => {
    const synced = syncAdminRowsFromRoles([role]);
    const draft = synced.drafts[0]!;
    expect(isAdminRoleRowDirty(synced.rows[0]!, draft)).toBe(false);
    expect(
      isAdminRoleRowDirty(synced.rows[0]!, { ...draft, name: "Curator" }),
    ).toBe(true);
  });

  it("toggles permissions on drafts", () => {
    const synced = syncAdminRowsFromRoles([role]);
    const draft = synced.drafts[0]!;
    const toggled = toggleRoleDraftPermission(draft, "users:read");
    expect(toggled.permissions).toContain("users:read");
    const removed = toggleRoleDraftPermission(toggled, "pages:read");
    expect(removed.permissions).not.toContain("pages:read");
  });

  it("validates create role form", () => {
    const form = {
      ...createDefaultCreateRoleFormState(),
      slug: "moderator",
      name: "Moderator",
    };
    expect(validateCreateRoleForm(form, ["moderator"], t)).toBe(
      "A role with this slug already exists.",
    );
    expect(validateCreateRoleForm(form, [], t)).toBeNull();
  });

  it("blocks delete for system roles and roles assigned to users", () => {
    const synced = syncAdminRowsFromRoles([role]);
    expect(canDeleteRole(synced.rows[0]!)).toBe(false);
    expect(roleDeleteBlockedReason(synced.rows[0]!, t)).toContain("assigned to 2 user");

    const unused = syncAdminRowsFromRoles([{ ...role, userCount: 0 }]);
    expect(canDeleteRole(unused.rows[0]!)).toBe(true);
    expect(roleDeleteBlockedReason(unused.rows[0]!, t)).toBeNull();
  });

  it("builds create and update payloads", () => {
    const form = {
      ...createDefaultCreateRoleFormState(),
      slug: "MOD",
      name: " Moderator ",
      description: "  ",
    };
    expect(buildCreateRolePayload(form)).toEqual({
      slug: "mod",
      name: "Moderator",
      description: null,
      permissions: ["pages:read"],
    });

    const synced = syncAdminRowsFromRoles([role]);
    expect(buildUpdateRolePayload(synced.drafts[0]!)).toEqual({
      slug: "moderator",
      name: "Moderator",
      description: "Reviews content",
      permissions: ["pages:read"],
    });
  });
});
