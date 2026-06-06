import type { AuthorOnboardingSnapshot } from "@/lib/authors/onboarding";
import { shouldPromptAuthorPageCreation } from "@/lib/authors/onboarding";

export type AuthorOnboardingDialogState = {
  open: boolean;
  canInteract: boolean;
};

export function resolveAuthorOnboardingDialogState(
  address: string | undefined,
  isConnected: boolean,
  snapshot: AuthorOnboardingSnapshot | null,
): AuthorOnboardingDialogState {
  void isConnected;
  return {
    open: shouldPromptAuthorPageCreation(snapshot),
    canInteract: Boolean(address),
  };
}
