import { getAddress } from "viem";

import type { AuthorProfile, WalletPreferences } from "@/lib/authors/types";
import type {
  User,
  UserPermission,
  UserPreferences,
  UserStatus,
} from "@/lib/users/types";
import { defaultUserPreferences, isUserPermission } from "@/lib/users/types";
import type { TokenRecord, WorkRecord } from "@/lib/works/types";

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

export type WorkDocumentLike = {
  workId: string;
  author: string;
  metadataURI: string;
  encryptedContentCid?: string | null;
  price: string;
  maxCopies: string;
  minted: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function toWorkRecord(doc: WorkDocumentLike): WorkRecord {
  return {
    workId: BigInt(doc.workId),
    author: getAddress(doc.author),
    metadataURI: doc.metadataURI,
    encryptedContentCid: doc.encryptedContentCid ?? null,
    price: BigInt(doc.price),
    maxCopies: BigInt(doc.maxCopies),
    minted: BigInt(doc.minted),
    active: doc.active,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export type TokenDocumentLike = {
  tokenId: string;
  workId: string;
  owner: string;
  copyNumber?: number | null;
  tbaAddress?: string | null;
  envelopeCid?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toTokenRecord(doc: TokenDocumentLike): TokenRecord {
  return {
    tokenId: BigInt(doc.tokenId),
    workId: BigInt(doc.workId),
    owner: getAddress(doc.owner),
    copyNumber: doc.copyNumber ?? null,
    tbaAddress: doc.tbaAddress ? getAddress(doc.tbaAddress) : null,
    envelopeCid: doc.envelopeCid ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
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
