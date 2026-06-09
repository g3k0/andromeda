import type { UserPermission } from "@/lib/users/types";

export type RoleMenuItem = {
  id: string;
  label: string;
};

export type RoleMenuContext = {
  roleSlug: string;
  roleName: string;
  permissions: readonly UserPermission[];
};

export const PROFILE_SETTINGS_MENU_ITEM: RoleMenuItem = {
  id: "profile-settings",
  label: "Profile settings",
};

export const CHANGE_LANGUAGE_MENU_ITEM: RoleMenuItem = {
  id: "change-language",
  label: "Change language",
};

export const BECOME_AUTHOR_MENU_ITEM: RoleMenuItem = {
  id: "become-author",
  label: "Become author",
};

export const MANAGE_USERS_MENU_ITEM: RoleMenuItem = {
  id: "manage-users",
  label: "Manage users and roles",
};

export const MANAGE_USERS_PATH = "/admin/users";

export function shouldShowBecomeAuthorMenuItem(context: RoleMenuContext): boolean {
  return context.roleSlug === "reader";
}

export function shouldShowManageUsersMenuItem(context: RoleMenuContext): boolean {
  return context.permissions.includes("admin:access");
}

export function getRoleMenuItems(context: RoleMenuContext): RoleMenuItem[] {
  const items = [PROFILE_SETTINGS_MENU_ITEM, CHANGE_LANGUAGE_MENU_ITEM];

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
