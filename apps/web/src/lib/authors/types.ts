export type AuthorProfile = {
  address: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
};

export type WalletPreferences = {
  declinedAuthorPage: boolean;
};

export type CreateAuthorProfileInput = Partial<
  Pick<AuthorProfile, "displayName" | "avatarUrl" | "bio">
>;
