"use server";

import { buildAuthorOnboardingSnapshotAsync } from "@/lib/authors/onboarding-server";

export async function getAuthorOnboardingSnapshotAction(
  address: string | undefined,
  isConnected: boolean,
) {
  return buildAuthorOnboardingSnapshotAsync(address, isConnected);
}
