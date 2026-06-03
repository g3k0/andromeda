export const AUTHORS_RECORD_STORAGE_KEY = "andromeda:authors";

export const WALLET_PREFERENCES_KEY_PREFIX = "andromeda:wallet-prefs:";

export function walletPreferencesStorageKey(normalizedAddress: string): string {
  return `${WALLET_PREFERENCES_KEY_PREFIX}${normalizedAddress}`;
}
