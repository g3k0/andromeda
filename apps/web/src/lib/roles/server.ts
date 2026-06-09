import "server-only";

import { createMongoRoleRepository } from "./adapters/create-role-repository";
import { createMongoUserRepository } from "@/lib/users/adapters/create-user-repository";
import { createRoleService, type RoleService } from "./role-service";

let cachedService: RoleService | null = null;
let invalidateSessionsByRoleSlug: ((slug: string) => Promise<void>) | null =
  null;

export async function getRoleService(): Promise<RoleService> {
  if (!cachedService) {
    const repository = await createMongoRoleRepository();
    const userRepository = await createMongoUserRepository();
    cachedService = createRoleService(repository, {
      countUsersByRoleSlug: (slug) => userRepository.countByRoleSlug(slug),
      invalidateSessionsByRoleSlug: async (slug) => {
        if (invalidateSessionsByRoleSlug) {
          await invalidateSessionsByRoleSlug(slug);
        }
      },
    });
  }
  return cachedService;
}

/** @internal Wires session invalidation after wallet session snapshot lands. */
export function setRoleSessionInvalidatorForTests(
  handler: ((slug: string) => Promise<void>) | null,
): void {
  invalidateSessionsByRoleSlug = handler;
  cachedService = null;
}

/** @internal Resets cached service between tests. */
export function resetRoleServiceForTests(): void {
  cachedService = null;
}
