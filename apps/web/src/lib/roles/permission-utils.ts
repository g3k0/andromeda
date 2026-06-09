import type { UserPermission } from "@/lib/users/types";
import { isUserPermission } from "@/lib/users/types";
import { InvalidRolePermissionsError } from "./errors";

export function assertKnownPermissions(permissions: string[]): UserPermission[] {
  const unknown = permissions.filter((permission) => !isUserPermission(permission));
  if (unknown.length > 0) {
    throw new InvalidRolePermissionsError(
      `Unknown permissions: ${unknown.join(", ")}.`,
    );
  }

  return permissions as UserPermission[];
}

export function assertAdminRolePermissions(
  slug: string,
  permissions: UserPermission[],
): void {
  if (slug !== "admin") {
    return;
  }

  const missing = ["admin:access", "users:write", "roles:write"].filter(
    (permission) => !permissions.includes(permission as UserPermission),
  );

  if (missing.length > 0) {
    throw new InvalidRolePermissionsError(
      `Admin role must include: ${missing.join(", ")}.`,
    );
  }
}
