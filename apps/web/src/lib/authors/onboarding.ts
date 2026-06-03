import { normalizeAddress } from "./address";
import { InvalidAddressError } from "./errors";
import {
  createAuthorProfile,
  getWalletPreferences,
  hasAuthorProfile,
  setWalletPreferences,
} from "./mock-store";

export type AuthorOnboardingSnapshot = {
  normalizedAddress: string;
  isConnected: boolean;
  hasAuthorProfile: boolean;
  declinedAuthorPage: boolean;
};

export function buildAuthorOnboardingSnapshot(
  address: string | null | undefined,
  isConnected: boolean,
): AuthorOnboardingSnapshot | null {
  if (!isConnected || !address) {
    return null;
  }

  const normalizedAddress = normalizeAddress(address);
  if (!normalizedAddress) {
    return null;
  }

  return {
    normalizedAddress,
    isConnected: true,
    hasAuthorProfile: hasAuthorProfile(normalizedAddress),
    declinedAuthorPage:
      getWalletPreferences(normalizedAddress)?.declinedAuthorPage ?? false,
  };
}

export function shouldPromptAuthorPageCreation(
  snapshot: AuthorOnboardingSnapshot | null,
): boolean {
  if (!snapshot) {
    return false;
  }
  if (snapshot.hasAuthorProfile) {
    return false;
  }
  if (snapshot.declinedAuthorPage) {
    return false;
  }
  return true;
}

export function authorPagePath(address: string): string {
  const normalized = normalizeAddress(address);
  if (!normalized) {
    throw new InvalidAddressError(address);
  }
  return `/author/${normalized}`;
}

export function acceptAuthorOnboarding(address: string): { redirectPath: string } {
  const profile = createAuthorProfile(address);
  return { redirectPath: authorPagePath(profile.address) };
}

export function declineAuthorOnboarding(address: string): void {
  setWalletPreferences(address, { declinedAuthorPage: true });
}
