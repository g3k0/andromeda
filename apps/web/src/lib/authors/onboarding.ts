import { defaultDisplayName, normalizeAddress } from "./address";
import { InvalidAddressError } from "./errors";
import type { AuthorService } from "./author-service";
import type { AuthorProfile } from "./types";

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
  const hasAuthorProfile = await service.hasAuthorProfile(normalizedAddress);

  // #region agent log
  fetch("http://127.0.0.1:7933/ingest/f893043c-5c97-4d7c-a866-e6f7fc139f26", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "4321f4",
    },
    body: JSON.stringify({
      sessionId: "4321f4",
      runId: "pre-fix",
      hypothesisId: "H3-H4",
      location: "onboarding.ts:buildAuthorOnboardingSnapshotFromService",
      message: "Wallet preferences vs author profile lookup",
      data: {
        normalizedAddressPrefix: normalizedAddress.slice(0, 10),
        hasAuthorProfile,
        walletPrefsDeclined: preferences?.declinedAuthorPage ?? null,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return {
    normalizedAddress,
    isConnected: true,
    hasAuthorProfile,
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

export function buildDraftAuthorProfile(address: string): AuthorProfile {
  const normalizedAddress = normalizeAddress(address);
  if (!normalizedAddress) {
    throw new InvalidAddressError(address);
  }

  return {
    address: normalizedAddress,
    displayName: defaultDisplayName(normalizedAddress),
    avatarUrl: null,
    createdAt: new Date().toISOString(),
  };
}

export function authorPagePath(address: string): string {
  const normalized = normalizeAddress(address);
  if (!normalized) {
    throw new InvalidAddressError(address);
  }
  return `/author/${normalized}`;
}
