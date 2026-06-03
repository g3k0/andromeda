import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getWalletPreferences,
  hasAuthorProfile,
} from "@/lib/authors/mock-store";
import { MemoryStorage, resetAuthorStoreStorage, setAuthorStoreStorage } from "@/lib/authors/storage";
import {
  handleAuthorOnboardingAccept,
  handleAuthorOnboardingDecline,
  resolveAuthorOnboardingDialogState,
} from "./author-onboarding-dialog-state";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

describe("author onboarding dialog state", () => {
  let storage: MemoryStorage;
  let onNavigate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    storage = new MemoryStorage();
    setAuthorStoreStorage(storage);
    onNavigate = vi.fn();
  });

  afterEach(() => {
    resetAuthorStoreStorage();
  });

  it("keeps the dialog closed when disconnected", () => {
    expect(resolveAuthorOnboardingDialogState(undefined, false)).toEqual({
      open: false,
      canInteract: false,
    });
  });

  it("opens the dialog for a connected wallet without a profile", () => {
    expect(resolveAuthorOnboardingDialogState(ADDRESS, true)).toEqual({
      open: true,
      canInteract: true,
    });
  });

  it("stays closed when the user already declined", () => {
    storage.setItem(
      `andromeda:wallet-prefs:${ADDRESS}`,
      JSON.stringify({ declinedAuthorPage: true }),
    );

    expect(resolveAuthorOnboardingDialogState(ADDRESS, true)).toEqual({
      open: false,
      canInteract: true,
    });
  });

  it("creates a profile and returns redirect path on accept", () => {
    const result = handleAuthorOnboardingAccept(ADDRESS);
    expect(result).toEqual({
      redirectPath: `/author/${ADDRESS}`,
      open: false,
    });
    expect(hasAuthorProfile(ADDRESS)).toBe(true);
    onNavigate(result.redirectPath);
    expect(onNavigate).toHaveBeenCalledWith(`/author/${ADDRESS}`);
  });

  it("stores reader-only preference on decline", () => {
    const result = handleAuthorOnboardingDecline(ADDRESS);
    expect(result).toEqual({ open: false });
    expect(getWalletPreferences(ADDRESS)).toEqual({
      declinedAuthorPage: true,
    });
    expect(
      resolveAuthorOnboardingDialogState(ADDRESS, true).open,
    ).toBe(false);
  });
});
