import type { User, UserPermission, UserRole } from "./types";

export const ROLE_PERMISSIONS: Record<UserRole, UserPermission[]> = {
  reader: ["pages:read"],
  author: ["pages:read", "authors:write:own"],
  admin: [
    "pages:read",
    "authors:write:own",
    "authors:write:any",
    "authors:delete:any",
    "users:read",
    "users:write",
    "users:delete",
    "admin:access",
  ],
};

export function getEffectivePermissions(user: User): UserPermission[] {
  if (user.permissions.length > 0) {
    return [...user.permissions];
  }
  return [...ROLE_PERMISSIONS[user.role]];
}

export function hasPermission(
  user: User,
  permission: UserPermission,
): boolean {
  return getEffectivePermissions(user).includes(permission);
}
