import { getAddress } from "viem";

import type { AuthorProfile, WalletPreferences } from "@/lib/authors/types";
import type {
  User,
  UserPermission,
  UserPreferences,
  UserStatus,
} from "@/lib/users/types";
import { defaultUserPreferences, isUserPermission } from "@/lib/users/types";
import type { TokenRecord, WorkRecord, WorkUploadRecord } from "@/lib/works/types";
import type { WorkImprintMetadata } from "@/lib/ipfs/metadata-schema";

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
  metadataURI?: string | null;
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
    metadataURI: doc.metadataURI ?? null,
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

export type WorkUploadDocumentLike = {
  _id: { toString(): string };
  author: string;
  name: string;
  metadataURI: string;
  metadataCid: string;
  contentCid: string;
  coverCid: string;
  externalUrl?: string | null;
  workImprint: WorkImprintMetadata;
  status: "uploaded" | "registered";
  workId?: string | null;
  registeredAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toWorkUploadRecord(doc: WorkUploadDocumentLike): WorkUploadRecord {
  return {
    id: doc._id.toString(),
    author: getAddress(doc.author),
    name: doc.name,
    metadataURI: doc.metadataURI,
    metadataCid: doc.metadataCid,
    contentCid: doc.contentCid,
    coverCid: doc.coverCid,
    externalUrl: doc.externalUrl ?? null,
    workImprint: doc.workImprint,
    status: doc.status,
    workId: doc.workId ?? null,
    registeredAt: doc.registeredAt ? doc.registeredAt.toISOString() : null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
