import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  AuthorProfileExistsError,
} from "./errors";
import {
  acceptAuthorOnboarding,
  authorPagePath,
  buildAuthorOnboardingSnapshot,
  declineAuthorOnboarding,
  shouldPromptAuthorPageCreation,
} from "./onboarding";
import {
  createAuthorProfile,
  getWalletPreferences,
  setWalletPreferences,
} from "./mock-store";
import { MemoryStorage, resetAuthorStoreStorage, setAuthorStoreStorage } from "./storage";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

describe("author onboarding", () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
    setAuthorStoreStorage(storage);
  });

  afterEach(() => {
    resetAuthorStoreStorage();
  });

  describe("buildAuthorOnboardingSnapshot", () => {
    it("returns null when the wallet is disconnected", () => {
      expect(buildAuthorOnboardingSnapshot(ADDRESS, false)).toBeNull();
      expect(buildAuthorOnboardingSnapshot(null, true)).toBeNull();
    });

    it("returns null for invalid addresses", () => {
      expect(buildAuthorOnboardingSnapshot("bad", true)).toBeNull();
    });

    it("returns snapshot data for a connected wallet", () => {
      setWalletPreferences(ADDRESS, { declinedAuthorPage: true });

      const snapshot = buildAuthorOnboardingSnapshot(ADDRESS, true);
      expect(snapshot).toEqual({
        normalizedAddress: ADDRESS,
        isConnected: true,
        hasAuthorProfile: false,
        declinedAuthorPage: true,
      });
    });

    it("detects an existing author profile", () => {
      createAuthorProfile(ADDRESS);

      const snapshot = buildAuthorOnboardingSnapshot(ADDRESS, true);
      expect(snapshot?.hasAuthorProfile).toBe(true);
    });
  });

  describe("shouldPromptAuthorPageCreation", () => {
    it("returns false when snapshot is null", () => {
      expect(shouldPromptAuthorPageCreation(null)).toBe(false);
    });

    it("returns false when a profile exists or the user declined", () => {
      expect(
        shouldPromptAuthorPageCreation({
          normalizedAddress: ADDRESS,
          isConnected: true,
          hasAuthorProfile: true,
          declinedAuthorPage: false,
        }),
      ).toBe(false);

      expect(
        shouldPromptAuthorPageCreation({
          normalizedAddress: ADDRESS,
          isConnected: true,
          hasAuthorProfile: false,
          declinedAuthorPage: true,
        }),
      ).toBe(false);
    });

    it("returns true for a connected wallet without profile or decline", () => {
      expect(
        shouldPromptAuthorPageCreation({
          normalizedAddress: ADDRESS,
          isConnected: true,
          hasAuthorProfile: false,
          declinedAuthorPage: false,
        }),
      ).toBe(true);
    });
  });

  describe("authorPagePath", () => {
    it("builds the author page URL for a normalized address", () => {
      expect(authorPagePath(ADDRESS.toUpperCase())).toBe(`/author/${ADDRESS}`);
    });
  });

  describe("acceptAuthorOnboarding", () => {
    it("creates a profile and returns the redirect path", () => {
      const result = acceptAuthorOnboarding(ADDRESS);
      expect(result.redirectPath).toBe(`/author/${ADDRESS}`);
      expect(() => acceptAuthorOnboarding(ADDRESS)).toThrow(
        AuthorProfileExistsError,
      );
    });
  });

  describe("declineAuthorOnboarding", () => {
    it("persists the reader-only preference", () => {
      declineAuthorOnboarding(ADDRESS);
      expect(getWalletPreferences(ADDRESS)).toEqual({
        declinedAuthorPage: true,
      });
    });
  });
});
