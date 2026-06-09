export type RoleTransitionContext = {
  hasAuthorProfile: boolean;
};

export function validateRoleTransition(
  currentRoleSlug: string,
  nextRoleSlug: string,
  context: RoleTransitionContext,
): string | null {
  if (currentRoleSlug === nextRoleSlug) {
    return null;
  }

  if (nextRoleSlug === "author" && !context.hasAuthorProfile) {
    return "Author role requires an existing author profile.";
  }

  return null;
}
