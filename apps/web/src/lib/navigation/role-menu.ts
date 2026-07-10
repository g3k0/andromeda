import type { UserPermission } from "@/lib/users/types";

export type RoleMenuItem = {
  id: string;
  labelKey: string;
};

export type RoleMenuContext = {
  roleSlug: string;
  roleName: string;
  permissions: readonly UserPermission[];
};

export const PROFILE_SETTINGS_MENU_ITEM: RoleMenuItem = {
  id: "profile-settings",
  labelKey: "roleMenu.profileSettings",
};

export const BECOME_AUTHOR_MENU_ITEM: RoleMenuItem = {
  id: "become-author",
  labelKey: "roleMenu.becomeAuthor",
};

export const MANAGE_USERS_MENU_ITEM: RoleMenuItem = {
  id: "manage-users",
  labelKey: "roleMenu.manageUsers",
};

export const MANAGE_USERS_PATH = "/admin/users";

export function shouldShowBecomeAuthorMenuItem(context: RoleMenuContext): boolean {
  return context.roleSlug === "reader";
}

export function shouldShowManageUsersMenuItem(context: RoleMenuContext): boolean {
  return context.permissions.includes("admin:access");
}

export function getRoleMenuItems(context: RoleMenuContext): RoleMenuItem[] {
  const items = [PROFILE_SETTINGS_MENU_ITEM];

  if (shouldShowManageUsersMenuItem(context)) {
    items.push(MANAGE_USERS_MENU_ITEM);
  }

  if (shouldShowBecomeAuthorMenuItem(context)) {
    items.push(BECOME_AUTHOR_MENU_ITEM);
  }

  return items;
}

export function getRoleMenuLabel(context: RoleMenuContext): string {
  return context.roleName;
}
