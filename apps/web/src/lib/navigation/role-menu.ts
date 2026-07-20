import type { UserPermission } from "@/lib/users/types";

export type RoleMenuItem = {
  id: string;
  labelKey: string;
};

export type RoleMenuContext = {
  roleSlug: string;
  roleName: string;
  permissions: readonly UserPermission[];
  hasAuthorProfile: boolean;
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

export const MY_AUTHOR_PAGE_MENU_ITEM: RoleMenuItem = {
  id: "my-author-page",
  labelKey: "nav.myPage",
};

export const MANAGE_USERS_PATH = "/admin/users";
export const MY_AUTHOR_PAGE_PATH = "/author";

export function shouldShowBecomeAuthorMenuItem(context: RoleMenuContext): boolean {
  return context.roleSlug === "reader";
}

export function shouldShowManageUsersMenuItem(context: RoleMenuContext): boolean {
  return context.permissions.includes("admin:access");
}

export function shouldShowMyAuthorPageMenuItem(context: RoleMenuContext): boolean {
  if (!context.hasAuthorProfile) {
    return false;
  }

  return context.roleSlug === "author" || context.roleSlug === "admin";
}

export function getRoleMenuItems(context: RoleMenuContext): RoleMenuItem[] {
  const items = [PROFILE_SETTINGS_MENU_ITEM];

  if (shouldShowMyAuthorPageMenuItem(context)) {
    items.push(MY_AUTHOR_PAGE_MENU_ITEM);
  }

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
