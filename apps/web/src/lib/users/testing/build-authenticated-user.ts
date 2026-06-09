import type { Role } from "@/lib/roles/types";
import { USER_PERMISSIONS } from "../types";
import { getEffectivePermissions } from "../permissions";
import type { AuthenticatedUser, UserPermission, UserStatus } from "../types";
import { defaultUserPreferences } from "../types";

const ROLE_PERMISSIONS_MAP: Record<string, UserPermission[]> = {
  reader: ["pages:read"],
  author: ["pages:read", "authors:write:own"],
  admin: [...USER_PERMISSIONS],
};

export function buildAuthenticatedUser(
  address: string,
  roleSlug: string,
  options?: {
    status?: UserStatus;
    permissionOverrides?: UserPermission[];
  },
): AuthenticatedUser {
  const now = new Date().toISOString();
  const user = {
    address,
    roleSlug,
    status: options?.status ?? "active",
    permissionOverrides: options?.permissionOverrides ?? [],
    preferences: defaultUserPreferences(),
    metadata: {},
    createdAt: now,
    updatedAt: now,
  };

  const role: Role = {
    slug: roleSlug,
    name: roleSlug,
    description: null,
    permissions: ROLE_PERMISSIONS_MAP[roleSlug] ?? ["pages:read"],
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  };

  return {
    ...user,
    role,
    permissions: getEffectivePermissions(user, role),
  };
}
