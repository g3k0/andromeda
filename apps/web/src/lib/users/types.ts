import type { Role } from "@/lib/roles/types";

export const USER_ROLES = ["admin", "author", "reader"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["active", "suspended", "pending"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const USER_PERMISSIONS = [
  "pages:read",
  "authors:write:own",
  "authors:write:any",
  "authors:delete:any",
  "users:read",
  "users:write",
  "users:delete",
  "admin:access",
  "roles:read",
  "roles:write",
  "roles:delete",
] as const;
export type UserPermission = (typeof USER_PERMISSIONS)[number];

export type UserPreferences = {
  declinedAuthorPage: boolean;
  onboardingCompletedAt: string | null;
};

export type User = {
  address: string;
  roleSlug: string;
  status: UserStatus;
  permissionOverrides: UserPermission[];
  preferences: UserPreferences;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type AuthenticatedUser = User & {
  role: Role;
  permissions: UserPermission[];
};

export type CreateUserInput = {
  address: string;
  roleSlug?: string;
  status?: UserStatus;
  permissionOverrides?: UserPermission[];
  preferences?: Partial<UserPreferences>;
  metadata?: Record<string, unknown>;
};

export type UserSnapshot = {
  normalizedAddress: string;
  isConnected: boolean;
  roleSlug: string;
  roleName: string;
  status: UserStatus;
  permissions: UserPermission[];
  hasAuthorProfile: boolean;
  declinedAuthorPage: boolean;
};

export type UserListFilter = {
  roleSlug?: string;
  status?: UserStatus;
};

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

export function isUserPermission(value: string): value is UserPermission {
  return (USER_PERMISSIONS as readonly string[]).includes(value);
}

export function defaultUserPreferences(): UserPreferences {
  return {
    declinedAuthorPage: false,
    onboardingCompletedAt: null,
  };
}
