import {
  acceptAuthorOnboarding,
  buildAuthorOnboardingSnapshot,
  declineAuthorOnboarding,
  shouldPromptAuthorPageCreation,
} from "@/lib/authors/onboarding";

export type AuthorOnboardingDialogState = {
  open: boolean;
  canInteract: boolean;
};

export function resolveAuthorOnboardingDialogState(
  address: string | undefined,
  isConnected: boolean,
): AuthorOnboardingDialogState {
  const snapshot = buildAuthorOnboardingSnapshot(address, isConnected);
  return {
    open: shouldPromptAuthorPageCreation(snapshot),
    canInteract: Boolean(address),
  };
}

export function handleAuthorOnboardingAccept(address: string): {
  redirectPath: string;
  open: false;
} {
  const { redirectPath } = acceptAuthorOnboarding(address);
  return { redirectPath, open: false };
}

export function handleAuthorOnboardingDecline(address: string): { open: false } {
  declineAuthorOnboarding(address);
  return { open: false };
}
