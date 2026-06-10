"use server";

import { checkAuth } from "@/lib/auth/require-auth";
import { buildAuthorOnboardingSnapshotAsync } from "@/lib/authors/onboarding-server";

export async function getAuthorOnboardingSnapshotAction(
  address: string | undefined,
  isConnected: boolean,
) {
  try {
    await checkAuth(address, isConnected);
  } catch {
    return null;
  }
  return buildAuthorOnboardingSnapshotAsync(address, isConnected);
}
