import { createInitialRowDrafts } from "./admin-users-state";
import type { AdminUserRowDraft } from "./admin-users-state";
import type { User, UserStatus } from "./types";

export type AdminUserRow = {
  address: string;
  roleSlug: string;
  status: UserStatus;
  createdAt: string;
};

export function truncateAddress(address: string, visibleChars = 6): string {
  if (address.length <= visibleChars * 2 + 2) {
    return address;
  }

  return `${address.slice(0, visibleChars + 2)}…${address.slice(-visibleChars)}`;
}

export function formatAdminUserCreatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toISOString().slice(0, 10);
}

export function userToAdminRow(user: User): AdminUserRow {
  return {
    address: user.address,
    roleSlug: user.roleSlug,
    status: user.status,
    createdAt: user.createdAt,
  };
}

export function usersToAdminRows(users: User[]): AdminUserRow[] {
  return users.map(userToAdminRow);
}

export function sortAdminRowsByCreatedAtDesc(rows: AdminUserRow[]): AdminUserRow[] {
  return [...rows].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export function syncAdminRowsFromUsers(users: User[]): {
  rows: AdminUserRow[];
  drafts: AdminUserRowDraft[];
} {
  const rows = sortAdminRowsByCreatedAtDesc(usersToAdminRows(users));
  return {
    rows,
    drafts: createInitialRowDrafts(rows),
  };
}
