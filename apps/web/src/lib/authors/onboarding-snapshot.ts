import type { AuthorOnboardingSnapshot } from "./onboarding";
import type { UserSnapshot } from "@/lib/users/types";

export function toAuthorOnboardingSnapshot(
  snapshot: UserSnapshot,
): AuthorOnboardingSnapshot {
  return {
    normalizedAddress: snapshot.normalizedAddress,
    isConnected: snapshot.isConnected,
    hasAuthorProfile: snapshot.hasAuthorProfile,
    declinedAuthorPage: snapshot.declinedAuthorPage,
  };
}
