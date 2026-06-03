import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AuthorProfileExistsError,
  AuthorProfileNotFoundError,
  InvalidAddressError,
} from "./errors";
import {
  createAuthorProfile,
  getAuthorByAddress,
  getWalletPreferences,
  hasAuthorProfile,
  setWalletPreferences,
  upsertAuthor,
} from "./mock-store";
import { MemoryStorage, resetAuthorStoreStorage, setAuthorStoreStorage } from "./storage";
import {
  AUTHORS_RECORD_STORAGE_KEY,
  walletPreferencesStorageKey,
} from "./storage-keys";

const VALID = "0xabcdef0123456789abcdef0123456789abcdef01";
const OTHER = "0x1111111111111111111111111111111111111111";

describe("author mock store", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    setAuthorStoreStorage(storage);
  });

  afterEach(() => {
    resetAuthorStoreStorage();
  });

  describe("getAuthorByAddress / hasAuthorProfile", () => {
    it("returns null when no profile exists", () => {
      expect(getAuthorByAddress(VALID)).toBeNull();
      expect(hasAuthorProfile(VALID)).toBe(false);
    });

    it("returns null for invalid address without throwing", () => {
      expect(getAuthorByAddress("bad")).toBeNull();
      expect(hasAuthorProfile("bad")).toBe(false);
    });

    it("does not auto-generate profiles on read", () => {
      expect(getAuthorByAddress(VALID)).toBeNull();
      expect(storage.getItem(AUTHORS_RECORD_STORAGE_KEY)).toBeNull();
    });
  });

  describe("createAuthorProfile", () => {
    it("creates a profile with defaults", () => {
      const profile = createAuthorProfile(VALID);

      expect(profile.address).toBe(VALID);
      expect(profile.displayName).toBe("0xabcd…ef01");
      expect(profile.avatarUrl).toBeNull();
      expect(profile.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(hasAuthorProfile(VALID)).toBe(true);
      expect(getAuthorByAddress(VALID)).toEqual(profile);
    });

    it("accepts optional display name and avatar", () => {
      const profile = createAuthorProfile(VALID, {
        displayName: "Jane Doe",
        avatarUrl: "ipfs://avatar",
      });

      expect(profile.displayName).toBe("Jane Doe");
      expect(profile.avatarUrl).toBe("ipfs://avatar");
    });

    it("normalizes address casing", () => {
      const upper = "0xABCDEF0123456789ABCDEF0123456789ABCDEF01";
      const profile = createAuthorProfile(upper);
      expect(profile.address).toBe(VALID);
    });

    it("throws for invalid address", () => {
      expect(() => createAuthorProfile("invalid")).toThrow(InvalidAddressError);
    });

    it("throws when profile already exists", () => {
      createAuthorProfile(VALID);
      expect(() => createAuthorProfile(VALID)).toThrow(AuthorProfileExistsError);
    });
  });

  describe("upsertAuthor", () => {
    it("updates an existing profile and preserves createdAt", () => {
      const created = createAuthorProfile(VALID, { displayName: "Before" });
      const updated = upsertAuthor({
        address: VALID,
        displayName: "After",
        avatarUrl: "ipfs://new",
        createdAt: "should-be-ignored",
      });

      expect(updated.displayName).toBe("After");
      expect(updated.avatarUrl).toBe("ipfs://new");
      expect(updated.createdAt).toBe(created.createdAt);
      expect(getAuthorByAddress(VALID)).toEqual(updated);
    });

    it("throws when updating a missing profile", () => {
      expect(() =>
        upsertAuthor({
          address: VALID,
          displayName: "Ghost",
          avatarUrl: null,
          createdAt: new Date().toISOString(),
        }),
      ).toThrow(AuthorProfileNotFoundError);
    });

    it("throws for invalid address in profile", () => {
      expect(() =>
        upsertAuthor({
          address: "nope",
          displayName: "X",
          avatarUrl: null,
          createdAt: new Date().toISOString(),
        }),
      ).toThrow(InvalidAddressError);
    });
  });

  describe("wallet preferences", () => {
    it("returns null when preferences are unset", () => {
      expect(getWalletPreferences(VALID)).toBeNull();
    });

    it("returns null for invalid address", () => {
      expect(getWalletPreferences("bad")).toBeNull();
    });

    it("persists declinedAuthorPage preference", () => {
      setWalletPreferences(VALID, { declinedAuthorPage: true });
      expect(getWalletPreferences(VALID)).toEqual({ declinedAuthorPage: true });

      setWalletPreferences(VALID, { declinedAuthorPage: false });
      expect(getWalletPreferences(VALID)).toEqual({ declinedAuthorPage: false });
    });

    it("isolates preferences per address", () => {
      setWalletPreferences(VALID, { declinedAuthorPage: true });
      setWalletPreferences(OTHER, { declinedAuthorPage: false });

      expect(getWalletPreferences(VALID)?.declinedAuthorPage).toBe(true);
      expect(getWalletPreferences(OTHER)?.declinedAuthorPage).toBe(false);
    });

    it("throws when setting preferences for invalid address", () => {
      expect(() =>
        setWalletPreferences("bad", { declinedAuthorPage: true }),
      ).toThrow(InvalidAddressError);
    });
  });

  describe("storage edge cases", () => {
    it("returns empty record when authors JSON is corrupt", () => {
      storage.setItem(AUTHORS_RECORD_STORAGE_KEY, "{not json");
      expect(getAuthorByAddress(VALID)).toBeNull();
    });

    it("returns null when preferences JSON is corrupt", () => {
      storage.setItem(walletPreferencesStorageKey(VALID), "{broken");
      expect(getWalletPreferences(VALID)).toBeNull();
    });

    it("returns null when preferences JSON has wrong shape", () => {
      storage.setItem(
        walletPreferencesStorageKey(VALID),
        JSON.stringify({ other: true }),
      );
      expect(getWalletPreferences(VALID)).toBeNull();
    });

    it("returns empty record when authors JSON is an array", () => {
      storage.setItem(AUTHORS_RECORD_STORAGE_KEY, JSON.stringify([]));
      expect(hasAuthorProfile(VALID)).toBe(false);
    });
  });
});
