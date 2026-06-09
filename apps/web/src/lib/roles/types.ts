import type { UserPermission } from "@/lib/users/types";

export type Role = {
  slug: string;
  name: string;
  description: string | null;
  permissions: UserPermission[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RoleWithUserCount = Role & {
  userCount: number;
};

export type CreateRoleInput = {
  slug: string;
  name: string;
  description?: string | null;
  permissions: UserPermission[];
  isSystem?: boolean;
};

export type UpdateRoleInput = {
  name?: string;
  description?: string | null;
  permissions?: UserPermission[];
};

export const ROLE_SLUG_PATTERN = /^[a-z0-9-]{2,32}$/;

export function isValidRoleSlug(value: string): boolean {
  return ROLE_SLUG_PATTERN.test(value);
}
