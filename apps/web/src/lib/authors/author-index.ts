import type { AuthorOnboardingSnapshot } from "./onboarding";
import { authorPagePath, shouldPromptAuthorPageCreation } from "./onboarding";

export type AuthorIndexResolved =
  | { status: "connect_wallet" }
  | { status: "redirect"; path: string }
  | { status: "onboarding" }
  | { status: "reader_mode" };

export function resolveAuthorIndexPage(
  snapshot: AuthorOnboardingSnapshot | null,
): AuthorIndexResolved {
  if (!snapshot) {
    return { status: "connect_wallet" };
  }

  if (snapshot.hasAuthorProfile) {
    return {
      status: "redirect",
      path: authorPagePath(snapshot.normalizedAddress),
    };
  }

  if (shouldPromptAuthorPageCreation(snapshot)) {
    return { status: "onboarding" };
  }

  return { status: "reader_mode" };
}
