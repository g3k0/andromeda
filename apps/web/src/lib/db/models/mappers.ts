import type { AuthorProfile, WalletPreferences } from "@/lib/authors/types";

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
