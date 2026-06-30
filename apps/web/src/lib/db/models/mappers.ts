import type { AuthorProfile, WalletPreferences } from "@/lib/authors/types";
import type {
  User,
  UserPermission,
  UserPreferences,
  UserStatus,
} from "@/lib/users/types";
import { defaultUserPreferences, isUserPermission } from "@/lib/users/types";

export type AuthorDocumentLike = {
  address: string;
  displayName: string;
  avatarUrl: string | null;
  bio?: string | null;
  createdAt: Date;
};

export type WalletPreferencesDocumentLike = {
  address: string;
  declinedAuthorPage: boolean;
};

export function toAuthorProfile(doc: AuthorDocumentLike): AuthorProfile {
  return {
    address: doc.address,
    displayName: doc.displayName,
    avatarUrl: doc.avatarUrl,
    bio: doc.bio ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
}

export function toWalletPreferences(
  doc: WalletPreferencesDocumentLike,
): WalletPreferences {
  return {
    declinedAuthorPage: doc.declinedAuthorPage,
  };
}

export type UserDocumentLike = {
  address: string;
  roleSlug?: string | null;
  role?: string | null;
  status: UserStatus;
  permissionOverrides?: string[] | null;
  permissions?: string[] | null;
  preferences?: {
    declinedAuthorPage?: boolean;
    onboardingCompletedAt?: Date | null;
  } | null;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

function toUserPreferences(
  preferences: UserDocumentLike["preferences"],
): UserPreferences {
  const defaults = defaultUserPreferences();
  return {
    declinedAuthorPage:
      preferences?.declinedAuthorPage ?? defaults.declinedAuthorPage,
    onboardingCompletedAt: preferences?.onboardingCompletedAt
      ? preferences.onboardingCompletedAt.toISOString()
      : defaults.onboardingCompletedAt,
  };
}

function toUserPermissionOverrides(
  permissionOverrides: string[] | null | undefined,
  legacyPermissions: string[] | null | undefined,
): UserPermission[] {
  const source = permissionOverrides ?? legacyPermissions ?? [];
  return source.filter(isUserPermission);
}

export function toUser(doc: UserDocumentLike): User {
  return {
    address: doc.address,
    roleSlug: doc.roleSlug ?? doc.role ?? "reader",
    status: doc.status,
    permissionOverrides: toUserPermissionOverrides(
      doc.permissionOverrides,
      doc.permissions,
    ),
    preferences: toUserPreferences(doc.preferences),
    metadata: doc.metadata ?? {},
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
