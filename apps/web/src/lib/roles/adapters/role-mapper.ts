import type { UserPermission } from "@/lib/users/types";
import { isUserPermission } from "@/lib/users/types";
import type { Role } from "../types";

export type RoleRecord = {
  slug: string;
  name: string;
  description?: string | null;
  permissions: string[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function toRolePermissions(permissions: string[]): UserPermission[] {
  return permissions.filter(isUserPermission);
}

function toIsoString(value: Date): string {
  return value.toISOString();
}

export function toRole(doc: RoleRecord): Role {
  return {
    slug: doc.slug,
    name: doc.name,
    description: doc.description ?? null,
    permissions: toRolePermissions(doc.permissions),
    isSystem: doc.isSystem,
    createdAt: toIsoString(doc.createdAt),
    updatedAt: toIsoString(doc.updatedAt),
  };
}
