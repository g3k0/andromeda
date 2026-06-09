import type { UserRole } from "@/lib/users/types";

export type RoleMenuItem = {
  id: string;
  label: string;
};

export const ROLE_MENU_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  author: "Author",
  reader: "Reader",
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
  label: "Manage users",
};

export const MANAGE_USERS_PATH = "/admin/users";

export function shouldShowBecomeAuthorMenuItem(role: UserRole): boolean {
  return role === "reader";
}

export function shouldShowManageUsersMenuItem(role: UserRole): boolean {
  return role === "admin";
}

export function getRoleMenuItems(role: UserRole): RoleMenuItem[] {
  const items = [PROFILE_SETTINGS_MENU_ITEM, CHANGE_LANGUAGE_MENU_ITEM];

  if (shouldShowManageUsersMenuItem(role)) {
    items.push(MANAGE_USERS_MENU_ITEM);
  }

  if (shouldShowBecomeAuthorMenuItem(role)) {
    items.push(BECOME_AUTHOR_MENU_ITEM);
  }

  return items;
}

export function getRoleMenuLabel(role: UserRole): string {
  return ROLE_MENU_LABELS[role];
}
