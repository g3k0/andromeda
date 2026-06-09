import { normalizeAddress } from "@/lib/authors/address";
import type { AdminUserRow } from "./admin-users-mappers";
import type { UserRole, UserStatus } from "./types";
import { USER_ROLES, USER_STATUSES } from "./types";

export type AdminUserRowDraft = {
  address: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};

export type CreateUserFormState = {
  targetAddress: string;
  role: UserRole;
  status: UserStatus;
  errorMessage: string | null;
};

export function createAdminUserRowDraft(row: AdminUserRow): AdminUserRowDraft {
  return {
    address: row.address,
    role: row.role,
    status: row.status,
    createdAt: row.createdAt,
  };
}

export function createInitialRowDrafts(rows: AdminUserRow[]): AdminUserRowDraft[] {
  return rows.map(createAdminUserRowDraft);
}

export function isAdminUserRowDirty(
  original: AdminUserRow,
  draft: AdminUserRowDraft,
): boolean {
  return original.role !== draft.role || original.status !== draft.status;
}

export function hasDirtyAdminUserRows(
  originals: AdminUserRow[],
  drafts: AdminUserRowDraft[],
): boolean {
  return originals.some((original, index) =>
    isAdminUserRowDirty(original, drafts[index] ?? original),
  );
}

export function createDefaultCreateUserFormState(): CreateUserFormState {
  return {
    targetAddress: "",
    role: "reader",
    status: "active",
    errorMessage: null,
  };
}

export function validateCreateUserAddress(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Wallet address is required.";
  }

  if (!normalizeAddress(trimmed)) {
    return "Invalid Ethereum address.";
  }

  return null;
}

export function validateCreateUserForm(
  form: CreateUserFormState,
  existingAddresses: readonly string[],
): string | null {
  const addressError = validateCreateUserAddress(form.targetAddress);
  if (addressError) {
    return addressError;
  }

  const normalized = normalizeAddress(form.targetAddress.trim());
  if (normalized && existingAddresses.includes(normalized)) {
    return "A user with this address already exists.";
  }

  return null;
}

export function buildUpdateUserPayload(draft: AdminUserRowDraft): {
  targetAddress: string;
  role: UserRole;
  status: UserStatus;
} {
  return {
    targetAddress: draft.address,
    role: draft.role,
    status: draft.status,
  };
}

export function isUserRoleValue(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

export function isUserStatusValue(value: string): value is UserStatus {
  return (USER_STATUSES as readonly string[]).includes(value);
}

export function updateRowDraftField<K extends keyof AdminUserRowDraft>(
  draft: AdminUserRowDraft,
  field: K,
  value: AdminUserRowDraft[K],
): AdminUserRowDraft {
  return {
    ...draft,
    [field]: value,
  };
}
