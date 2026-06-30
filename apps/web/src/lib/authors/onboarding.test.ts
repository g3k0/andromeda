import { describe, expect, it } from "vitest";
import { createAuthorService } from "./author-service";
import {
  authorPagePath,
  buildAuthorOnboardingSnapshotFromService,
  buildDraftAuthorProfile,
  shouldPromptAuthorPageCreation,
} from "./onboarding";
import { createInMemoryAuthorRepositories } from "./testing/in-memory-repositories";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

describe("author onboarding", () => {
  function service() {
    return createAuthorService(createInMemoryAuthorRepositories());
  }

  describe("buildAuthorOnboardingSnapshotFromService", () => {
    it("returns null when the wallet is disconnected", async () => {
      await expect(
        buildAuthorOnboardingSnapshotFromService(ADDRESS, false, service()),
      ).resolves.toBeNull();
      await expect(
        buildAuthorOnboardingSnapshotFromService(null, true, service()),
      ).resolves.toBeNull();
    });

    it("returns null for invalid addresses", async () => {
      await expect(
        buildAuthorOnboardingSnapshotFromService("bad", true, service()),
      ).resolves.toBeNull();
    });

    it("returns snapshot data for a connected wallet", async () => {
      const svc = service();
      await svc.setWalletPreferences(ADDRESS, { declinedAuthorPage: true });

      const snapshot = await buildAuthorOnboardingSnapshotFromService(
        ADDRESS,
        true,
        svc,
      );
      expect(snapshot).toEqual({
        normalizedAddress: ADDRESS,
        isConnected: true,
        hasAuthorProfile: false,
        declinedAuthorPage: true,
      });
    });

    it("detects an existing author profile", async () => {
      const svc = service();
      await svc.createAuthorProfile(ADDRESS);

      const snapshot = await buildAuthorOnboardingSnapshotFromService(
        ADDRESS,
        true,
        svc,
      );
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

  describe("buildDraftAuthorProfile", () => {
    it("builds a draft profile for onboarding editing", () => {
      const profile = buildDraftAuthorProfile(ADDRESS.toUpperCase());

      expect(profile.address).toBe(ADDRESS);
      expect(profile.displayName).toBe("0xabcd…ef01");
      expect(profile.avatarUrl).toBeNull();
      expect(profile.bio).toBeNull();
      expect(profile.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe("authorPagePath", () => {
    it("builds the author page URL for a normalized address", () => {
      expect(authorPagePath(ADDRESS.toUpperCase())).toBe(`/author/${ADDRESS}`);
    });
  });
});
