import type { RoleDocument } from "@/lib/db/models/role.model";
import type { UserPermission } from "@/lib/users/types";
import { isUserPermission } from "@/lib/users/types";
import type { Role } from "../types";

function toRolePermissions(permissions: string[]): UserPermission[] {
  return permissions.filter(isUserPermission);
}

export function toRole(doc: RoleDocument): Role {
  return {
    slug: doc.slug,
    name: doc.name,
    description: doc.description ?? null,
    permissions: toRolePermissions(doc.permissions),
    isSystem: doc.isSystem,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
