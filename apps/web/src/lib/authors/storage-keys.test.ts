import { describe, expect, it } from "vitest";
import {
  AUTHORS_RECORD_STORAGE_KEY,
  WALLET_PREFERENCES_KEY_PREFIX,
  walletPreferencesStorageKey,
} from "./storage-keys";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

describe("author storage keys", () => {
  it("exposes stable localStorage keys for the mock store", () => {
    expect(AUTHORS_RECORD_STORAGE_KEY).toBe("andromeda:authors");
    expect(WALLET_PREFERENCES_KEY_PREFIX).toBe("andromeda:wallet-prefs:");
  });

  it("builds a per-wallet preferences key from a normalized address", () => {
    expect(walletPreferencesStorageKey(ADDRESS)).toBe(
      `andromeda:wallet-prefs:${ADDRESS}`,
    );
  });
});
