import { defaultDisplayName, normalizeAddress } from "./address";
import {
  AuthorProfileExistsError,
  AuthorProfileNotFoundError,
  InvalidAddressError,
} from "./errors";
import { getAuthorStoreStorage } from "./storage";
import {
  AUTHORS_RECORD_STORAGE_KEY,
  walletPreferencesStorageKey,
} from "./storage-keys";
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

function readAuthorsRecord(): Record<string, AuthorProfile> {
  const storage = getAuthorStoreStorage();
  const raw = storage.getItem(AUTHORS_RECORD_STORAGE_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, AuthorProfile>;
    }
  } catch {
    return {};
  }
  return {};
}

function writeAuthorsRecord(record: Record<string, AuthorProfile>): void {
  const storage = getAuthorStoreStorage();
  storage.setItem(AUTHORS_RECORD_STORAGE_KEY, JSON.stringify(record));
}

export function getAuthorByAddress(address: string): AuthorProfile | null {
  const normalized = normalizeAddress(address);
  if (!normalized) {
    return null;
  }
  return readAuthorsRecord()[normalized] ?? null;
}

export function hasAuthorProfile(address: string): boolean {
  return getAuthorByAddress(address) !== null;
}

export function createAuthorProfile(
  address: string,
  input: CreateAuthorProfileInput = {},
): AuthorProfile {
  const normalized = requireNormalizedAddress(address);
  const record = readAuthorsRecord();
  if (record[normalized]) {
    throw new AuthorProfileExistsError(normalized);
  }

  const profile: AuthorProfile = {
    address: normalized,
    displayName: input.displayName ?? defaultDisplayName(normalized),
    avatarUrl: input.avatarUrl ?? null,
    createdAt: new Date().toISOString(),
  };

  record[normalized] = profile;
  writeAuthorsRecord(record);
  return profile;
}

export function upsertAuthor(profile: AuthorProfile): AuthorProfile {
  const normalized = requireNormalizedAddress(profile.address);
  const record = readAuthorsRecord();
  const existing = record[normalized];
  if (!existing) {
    throw new AuthorProfileNotFoundError(normalized);
  }

  const updated: AuthorProfile = {
    address: normalized,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    createdAt: existing.createdAt,
  };

  record[normalized] = updated;
  writeAuthorsRecord(record);
  return updated;
}

export function getWalletPreferences(address: string): WalletPreferences | null {
  const normalized = normalizeAddress(address);
  if (!normalized) {
    return null;
  }

  const storage = getAuthorStoreStorage();
  const raw = storage.getItem(walletPreferencesStorageKey(normalized));
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      "declinedAuthorPage" in parsed &&
      typeof (parsed as WalletPreferences).declinedAuthorPage === "boolean"
    ) {
      return parsed as WalletPreferences;
    }
  } catch {
    return null;
  }
  return null;
}

export function setWalletPreferences(
  address: string,
  preferences: WalletPreferences,
): WalletPreferences {
  const normalized = requireNormalizedAddress(address);
  const storage = getAuthorStoreStorage();
  storage.setItem(
    walletPreferencesStorageKey(normalized),
    JSON.stringify(preferences),
  );
  return preferences;
}
