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
  roleSlug?: string | null,
): AuthorOnboardingDialogState {
  void isConnected;
  if (roleSlug === "admin") {
    return {
      open: false,
      canInteract: Boolean(address),
    };
  }
  return {
    open: shouldPromptAuthorPageCreation(snapshot),
    canInteract: Boolean(address),
  };
}
