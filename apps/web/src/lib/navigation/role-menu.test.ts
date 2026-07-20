import { describe, expect, it } from "vitest";
import { defaultPermissionsForRoleSlug } from "@/lib/users/default-role-permissions";
import {
  BECOME_AUTHOR_MENU_ITEM,
  MANAGE_USERS_MENU_ITEM,
  MY_AUTHOR_PAGE_MENU_ITEM,
  PROFILE_SETTINGS_MENU_ITEM,
  getRoleMenuItems,
  getRoleMenuLabel,
  shouldShowBecomeAuthorMenuItem,
  shouldShowManageUsersMenuItem,
  shouldShowMyAuthorPageMenuItem,
  type RoleMenuContext,
} from "./role-menu";

function menuContext(
  roleSlug: string,
  roleName: string,
  options?: {
    permissions?: RoleMenuContext["permissions"];
    hasAuthorProfile?: boolean;
  },
): RoleMenuContext {
  return {
    roleSlug,
    roleName,
    permissions: options?.permissions ?? defaultPermissionsForRoleSlug(roleSlug),
    hasAuthorProfile: options?.hasAuthorProfile ?? false,
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
        menuContext("ops", "Ops", { permissions: ["admin:access", "pages:read"] }),
      ),
    ).toBe(true);
    expect(shouldShowManageUsersMenuItem(menuContext("author", "Author"))).toBe(
      false,
    );
  });

  it("shows my page only for authors and admins with a profile", () => {
    expect(
      shouldShowMyAuthorPageMenuItem(
        menuContext("author", "Author", { hasAuthorProfile: true }),
      ),
    ).toBe(true);
    expect(
      shouldShowMyAuthorPageMenuItem(
        menuContext("admin", "Admin", { hasAuthorProfile: true }),
      ),
    ).toBe(true);
    expect(
      shouldShowMyAuthorPageMenuItem(
        menuContext("admin", "Admin", { hasAuthorProfile: false }),
      ),
    ).toBe(false);
    expect(
      shouldShowMyAuthorPageMenuItem(
        menuContext("reader", "Reader", { hasAuthorProfile: true }),
      ),
    ).toBe(false);
  });

  it("builds role-specific menu items", () => {
    expect(getRoleMenuItems(menuContext("reader", "Reader"))).toEqual([
      PROFILE_SETTINGS_MENU_ITEM,
      BECOME_AUTHOR_MENU_ITEM,
    ]);
    expect(
      getRoleMenuItems(
        menuContext("author", "Author", { hasAuthorProfile: true }),
      ),
    ).toEqual([PROFILE_SETTINGS_MENU_ITEM, MY_AUTHOR_PAGE_MENU_ITEM]);
    expect(
      getRoleMenuItems(
        menuContext("admin", "Admin", { hasAuthorProfile: true }),
      ),
    ).toEqual([
      PROFILE_SETTINGS_MENU_ITEM,
      MY_AUTHOR_PAGE_MENU_ITEM,
      MANAGE_USERS_MENU_ITEM,
    ]);
  });
});
