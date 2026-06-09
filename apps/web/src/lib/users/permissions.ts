import type { Role } from "@/lib/roles/types";
import type { User, UserPermission } from "./types";

export type PermissionSubject = {
  permissions: UserPermission[];
};

export function getEffectivePermissions(
  user: User,
  role: Role,
): UserPermission[] {
  const effective = new Set<UserPermission>(role.permissions);
  for (const grant of user.permissionOverrides) {
    effective.add(grant);
  }
  return [...effective];
}

export function hasPermission(
  subject: PermissionSubject,
  permission: UserPermission,
): boolean {
  return subject.permissions.includes(permission);
}
