import type { UserRole } from "./types";

export type RoleTransitionContext = {
  hasAuthorProfile: boolean;
};

export function validateRoleTransition(
  currentRole: UserRole,
  nextRole: UserRole,
  context: RoleTransitionContext,
): string | null {
  if (currentRole === nextRole) {
    return null;
  }

  if (nextRole === "author" && !context.hasAuthorProfile) {
    return "Author role requires an existing author profile.";
  }

  return null;
}
