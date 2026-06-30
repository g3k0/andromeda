import type { AuthorRepositories } from "../repository";
import type {
  AuthorProfile,
  CreateAuthorProfileInput,
  WalletPreferences,
} from "../types";

export function createInMemoryAuthorRepositories(): AuthorRepositories {
  const authors = new Map<string, AuthorProfile>();
  const preferences = new Map<string, WalletPreferences>();

  return {
    authors: {
      async getByAddress(address: string) {
        return authors.get(address) ?? null;
      },
      async exists(address: string) {
        return authors.has(address);
      },
      async create(address: string, input: CreateAuthorProfileInput = {}) {
        const profile: AuthorProfile = {
          address,
          displayName: input.displayName ?? address,
          avatarUrl: input.avatarUrl ?? null,
          bio: input.bio ?? null,
          createdAt: new Date().toISOString(),
        };
        authors.set(address, profile);
        return profile;
      },
      async update(profile: AuthorProfile) {
        authors.set(profile.address, profile);
        return profile;
      },
    },
    walletPreferences: {
      async getByAddress(address: string) {
        return preferences.get(address) ?? null;
      },
      async set(address: string, prefs: WalletPreferences) {
        preferences.set(address, prefs);
        return prefs;
      },
    },
  };
}
