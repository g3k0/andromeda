import type { UserPermission } from "@/lib/users/types";
import type { RoleWithUserCount } from "./types";
import { isValidRoleSlug } from "./types";

export type AdminRoleRow = {
  slug: string;
  name: string;
  description: string | null;
  permissions: UserPermission[];
  isSystem: boolean;
  userCount: number;
};

export type AdminRoleRowDraft = {
  slug: string;
  name: string;
  description: string;
  permissions: UserPermission[];
};

export type CreateRoleFormState = {
  slug: string;
  name: string;
  description: string;
  permissions: UserPermission[];
  errorMessage: string | null;
};

export function roleToAdminRow(role: RoleWithUserCount): AdminRoleRow {
  return {
    slug: role.slug,
    name: role.name,
    description: role.description,
    permissions: [...role.permissions],
    isSystem: role.isSystem,
    userCount: role.userCount,
  };
}

export function createAdminRoleRowDraft(row: AdminRoleRow): AdminRoleRowDraft {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    permissions: [...row.permissions],
  };
}

export function syncAdminRowsFromRoles(roles: RoleWithUserCount[]): {
  rows: AdminRoleRow[];
  drafts: AdminRoleRowDraft[];
} {
  const rows = roles.map(roleToAdminRow);
  return {
    rows,
    drafts: rows.map(createAdminRoleRowDraft),
  };
}

export function isAdminRoleRowDirty(
  original: AdminRoleRow,
  draft: AdminRoleRowDraft,
): boolean {
  const normalizedDescription = draft.description.trim() || null;
  if (original.name !== draft.name.trim()) {
    return true;
  }
  if (original.description !== normalizedDescription) {
    return true;
  }
  if (original.permissions.length !== draft.permissions.length) {
    return true;
  }
  const sortedOriginal = [...original.permissions].sort();
  const sortedDraft = [...draft.permissions].sort();
  return sortedOriginal.some(
    (permission, index) => permission !== sortedDraft[index],
  );
}

export function toggleRoleDraftPermission(
  draft: AdminRoleRowDraft,
  permission: UserPermission,
): AdminRoleRowDraft {
  const hasPermission = draft.permissions.includes(permission);
  return {
    ...draft,
    permissions: hasPermission
      ? draft.permissions.filter((item) => item !== permission)
      : [...draft.permissions, permission],
  };
}

export function createDefaultCreateRoleFormState(): CreateRoleFormState {
  return {
    slug: "",
    name: "",
    description: "",
    permissions: ["pages:read"],
    errorMessage: null,
  };
}

export function validateCreateRoleForm(
  form: CreateRoleFormState,
  existingSlugs: readonly string[],
): string | null {
  const slug = form.slug.trim().toLowerCase();
  if (!slug) {
    return "Role slug is required.";
  }
  if (!isValidRoleSlug(slug)) {
    return "Invalid role slug. Use 2–32 lowercase letters, numbers, or hyphens.";
  }
  if (existingSlugs.includes(slug)) {
    return "A role with this slug already exists.";
  }
  if (!form.name.trim()) {
    return "Role name is required.";
  }
  if (form.permissions.length === 0) {
    return "Select at least one permission.";
  }
  return null;
}

export function buildUpdateRolePayload(draft: AdminRoleRowDraft) {
  const description = draft.description.trim();
  return {
    slug: draft.slug,
    name: draft.name.trim(),
    description: description.length > 0 ? description : null,
    permissions: draft.permissions,
  };
}

export function buildCreateRolePayload(form: CreateRoleFormState) {
  const description = form.description.trim();
  return {
    slug: form.slug.trim().toLowerCase(),
    name: form.name.trim(),
    description: description.length > 0 ? description : null,
    permissions: form.permissions,
  };
}
