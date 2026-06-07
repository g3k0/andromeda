import type { AuthorProfile, WalletPreferences } from "@/lib/authors/types";
import type {
  User,
  UserPermission,
  UserPreferences,
  UserRole,
  UserStatus,
} from "@/lib/users/types";
import { defaultUserPreferences, isUserPermission } from "@/lib/users/types";

export type AuthorDocumentLike = {
  address: string;
  displayName: string;
  avatarUrl: string | null;
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
  role: UserRole;
  status: UserStatus;
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

function toUserPermissions(permissions: string[] | null | undefined): UserPermission[] {
  return (permissions ?? []).filter(isUserPermission);
}

export function toUser(doc: UserDocumentLike): User {
  return {
    address: doc.address,
    role: doc.role,
    status: doc.status,
    permissions: toUserPermissions(doc.permissions),
    preferences: toUserPreferences(doc.preferences),
    metadata: doc.metadata ?? {},
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
