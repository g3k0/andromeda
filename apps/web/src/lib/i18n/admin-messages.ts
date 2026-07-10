import type { AdminUserColumnDef, AdminUserColumnId } from "@/lib/users/admin-user-columns";
import type { UserPermission, UserStatus } from "@/lib/users/types";
import type { TranslateFn } from "./translate";

const ADMIN_USER_COLUMN_LABEL_KEYS: Record<AdminUserColumnId, string> = {
  address: "admin.users.columns.address",
  role: "admin.users.columns.role",
  status: "admin.users.columns.status",
  createdAt: "admin.users.columns.createdAt",
};

const USER_STATUS_LABEL_KEYS: Record<UserStatus, string> = {
  active: "admin.users.status.active",
  suspended: "admin.users.status.suspended",
  pending: "admin.users.status.pending",
};

const PERMISSION_LABEL_KEYS: Record<UserPermission, string> = {
  "pages:read": "admin.permissions.pagesRead",
  "authors:write:own": "admin.permissions.authorsWriteOwn",
  "authors:write:any": "admin.permissions.authorsWriteAny",
  "authors:delete:any": "admin.permissions.authorsDeleteAny",
  "users:read": "admin.permissions.usersRead",
  "users:write": "admin.permissions.usersWrite",
  "users:delete": "admin.permissions.usersDelete",
  "admin:access": "admin.permissions.adminAccess",
  "roles:read": "admin.permissions.rolesRead",
  "roles:write": "admin.permissions.rolesWrite",
  "roles:delete": "admin.permissions.rolesDelete",
};

export function getAdminUserColumns(t: TranslateFn): AdminUserColumnDef[] {
  return [
    { id: "address", label: t(ADMIN_USER_COLUMN_LABEL_KEYS.address), editable: false },
    { id: "role", label: t(ADMIN_USER_COLUMN_LABEL_KEYS.role), editable: true },
    { id: "status", label: t(ADMIN_USER_COLUMN_LABEL_KEYS.status), editable: true },
    { id: "createdAt", label: t(ADMIN_USER_COLUMN_LABEL_KEYS.createdAt), editable: false },
  ];
}

export function getUserStatusLabel(t: TranslateFn, status: UserStatus): string {
  return t(USER_STATUS_LABEL_KEYS[status]);
}

export function getPermissionLabel(t: TranslateFn, permission: UserPermission): string {
  return t(PERMISSION_LABEL_KEYS[permission]);
}

export function formatAdminRoleUserCount(t: TranslateFn, count: number): string {
  return count === 1
    ? t("admin.roles.userCountSingular", { count: String(count) })
    : t("admin.roles.userCountPlural", { count: String(count) });
}
