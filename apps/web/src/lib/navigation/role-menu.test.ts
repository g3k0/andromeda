import { describe, expect, it } from "vitest";
import { defaultPermissionsForRoleSlug } from "@/lib/users/default-role-permissions";
import {
  BECOME_AUTHOR_MENU_ITEM,
  MANAGE_USERS_MENU_ITEM,
  PROFILE_SETTINGS_MENU_ITEM,
  getRoleMenuItems,
  getRoleMenuLabel,
  shouldShowBecomeAuthorMenuItem,
  shouldShowManageUsersMenuItem,
  type RoleMenuContext,
} from "./role-menu";

function menuContext(
  roleSlug: string,
  roleName: string,
  permissions?: RoleMenuContext["permissions"],
): RoleMenuContext {
  return {
    roleSlug,
    roleName,
    permissions: permissions ?? defaultPermissionsForRoleSlug(roleSlug),
  };
}

describe("role menu", () => {
  it("uses the role name from snapshot context", () => {
    expect(getRoleMenuLabel(menuContext("admin", "Admin"))).toBe("Admin");
    expect(getRoleMenuLabel(menuContext("moderator", "Moderator"))).toBe(
      "Moderator",
    );
  });

  it("shows become-author only for readers", () => {
    expect(shouldShowBecomeAuthorMenuItem(menuContext("reader", "Reader"))).toBe(
      true,
    );
    expect(shouldShowBecomeAuthorMenuItem(menuContext("author", "Author"))).toBe(
      false,
    );
  });

  it("shows manage-users when snapshot permissions include admin access", () => {
    expect(shouldShowManageUsersMenuItem(menuContext("admin", "Admin"))).toBe(
      true,
    );
    expect(
      shouldShowManageUsersMenuItem(
        menuContext("ops", "Ops", ["admin:access", "pages:read"]),
      ),
    ).toBe(true);
    expect(shouldShowManageUsersMenuItem(menuContext("author", "Author"))).toBe(
      false,
    );
  });

  it("builds role-specific menu items", () => {
    expect(getRoleMenuItems(menuContext("reader", "Reader"))).toEqual([
      PROFILE_SETTINGS_MENU_ITEM,
      BECOME_AUTHOR_MENU_ITEM,
    ]);
    expect(getRoleMenuItems(menuContext("author", "Author"))).toEqual([
      PROFILE_SETTINGS_MENU_ITEM,
    ]);
    expect(getRoleMenuItems(menuContext("admin", "Admin"))).toEqual([
      PROFILE_SETTINGS_MENU_ITEM,
      MANAGE_USERS_MENU_ITEM,
    ]);
  });
});
