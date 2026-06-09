import { InvalidPermissionOverridesError } from "./errors";
import type { UserPermission } from "./types";

const PRIVILEGED_PERMISSIONS: UserPermission[] = [
  "admin:access",
  "roles:write",
  "users:delete",
];

export function assertValidPermissionOverrides(
  roleSlug: string,
  rolePermissions: readonly UserPermission[],
  overrides: readonly UserPermission[],
): void {
  const rolePermissionSet = new Set(rolePermissions);

  for (const grant of overrides) {
    if (roleSlug !== "admin" && PRIVILEGED_PERMISSIONS.includes(grant)) {
      throw new InvalidPermissionOverridesError(
        `Permission override "${grant}" is not allowed for role "${roleSlug}".`,
      );
    }

    if (!rolePermissionSet.has(grant)) {
      throw new InvalidPermissionOverridesError(
        `Permission override "${grant}" is not included in role "${roleSlug}".`,
      );
    }
  }
}
