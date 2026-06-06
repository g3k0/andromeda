import { normalizeAddress } from "./address";
import { InvalidAddressError } from "./errors";
import type { AuthorService } from "./author-service";

export type AuthorOnboardingSnapshot = {
  normalizedAddress: string;
  isConnected: boolean;
  hasAuthorProfile: boolean;
  declinedAuthorPage: boolean;
};

export async function buildAuthorOnboardingSnapshotFromService(
  address: string | null | undefined,
  isConnected: boolean,
  service: AuthorService,
): Promise<AuthorOnboardingSnapshot | null> {
  if (!isConnected || !address) {
    return null;
  }

  const normalizedAddress = normalizeAddress(address);
  if (!normalizedAddress) {
    return null;
  }

  const preferences = await service.getWalletPreferences(normalizedAddress);

  return {
    normalizedAddress,
    isConnected: true,
    hasAuthorProfile: await service.hasAuthorProfile(normalizedAddress),
    declinedAuthorPage: preferences?.declinedAuthorPage ?? false,
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
