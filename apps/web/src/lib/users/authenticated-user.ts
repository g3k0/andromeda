import { RoleNotFoundError } from "@/lib/roles/errors";
import type { RoleRepository } from "@/lib/roles/repository";
import { getEffectivePermissions } from "./permissions";
import type { AuthenticatedUser, User } from "./types";

export async function toAuthenticatedUser(
  user: User,
  roles: RoleRepository,
): Promise<AuthenticatedUser> {
  const role = await roles.getBySlug(user.roleSlug);
  if (!role) {
    throw new RoleNotFoundError(user.roleSlug);
  }

  return {
    ...user,
    role,
    permissions: getEffectivePermissions(user, role),
  };
}
