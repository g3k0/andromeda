import type {
  AuthorProfile,
  CreateAuthorProfileInput,
  WalletPreferences,
} from "./types";

export type AuthorRepository = {
  getByAddress(address: string): Promise<AuthorProfile | null>;
  exists(address: string): Promise<boolean>;
  create(
    address: string,
    input?: CreateAuthorProfileInput,
  ): Promise<AuthorProfile>;
  update(profile: AuthorProfile): Promise<AuthorProfile>;
};

export type WalletPreferencesRepository = {
  getByAddress(address: string): Promise<WalletPreferences | null>;
  set(
    address: string,
    preferences: WalletPreferences,
  ): Promise<WalletPreferences>;
};

export type AuthorRepositories = {
  authors: AuthorRepository;
  walletPreferences: WalletPreferencesRepository;
};
