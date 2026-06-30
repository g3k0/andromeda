import { defaultDisplayName, normalizeAddress } from "./address";
import {
  AuthorProfileExistsError,
  AuthorProfileNotFoundError,
  InvalidAddressError,
} from "./errors";
import type { AuthorRepositories } from "./repository";
import type {
  AuthorProfile,
  CreateAuthorProfileInput,
  WalletPreferences,
} from "./types";

function requireNormalizedAddress(address: string): string {
  const normalized = normalizeAddress(address);
  if (!normalized) {
    throw new InvalidAddressError(address);
  }
  return normalized;
}

export function createAuthorService(repositories: AuthorRepositories) {
  const { authors, walletPreferences } = repositories;

  return {
    async getAuthorByAddress(address: string): Promise<AuthorProfile | null> {
      const normalized = normalizeAddress(address);
      if (!normalized) {
        return null;
      }
      return authors.getByAddress(normalized);
    },

    async hasAuthorProfile(address: string): Promise<boolean> {
      const normalized = normalizeAddress(address);
      if (!normalized) {
        return false;
      }
      return authors.exists(normalized);
    },

    async createAuthorProfile(
      address: string,
      input: CreateAuthorProfileInput = {},
    ): Promise<AuthorProfile> {
      const normalized = requireNormalizedAddress(address);
      if (await authors.exists(normalized)) {
        throw new AuthorProfileExistsError(normalized);
      }

      return authors.create(normalized, {
        displayName: input.displayName ?? defaultDisplayName(normalized),
        avatarUrl: input.avatarUrl ?? null,
        bio: input.bio ?? null,
      });
    },

    async upsertAuthor(profile: AuthorProfile): Promise<AuthorProfile> {
      const normalized = requireNormalizedAddress(profile.address);
      const existing = await authors.getByAddress(normalized);
      if (!existing) {
        throw new AuthorProfileNotFoundError(normalized);
      }

      return authors.update({
        address: normalized,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
        createdAt: existing.createdAt,
      });
    },

    async getWalletPreferences(
      address: string,
    ): Promise<WalletPreferences | null> {
      const normalized = normalizeAddress(address);
      if (!normalized) {
        return null;
      }
      return walletPreferences.getByAddress(normalized);
    },

    async setWalletPreferences(
      address: string,
      preferences: WalletPreferences,
    ): Promise<WalletPreferences> {
      const normalized = requireNormalizedAddress(address);
      return walletPreferences.set(normalized, preferences);
    },
  };
}

export type AuthorService = ReturnType<typeof createAuthorService>;
