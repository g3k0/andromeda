import "server-only";

import { getWalletSessionService } from "@/lib/auth/wallet-session-server";
import { createMongoRoleRepository } from "./adapters/create-role-repository";
import { createMongoUserRepository } from "@/lib/users/adapters/create-user-repository";
import { createRoleService, type RoleService } from "./role-service";

let cachedService: RoleService | null = null;

export async function getRoleService(): Promise<RoleService> {
  if (!cachedService) {
    const [repository, userRepository, sessionService] = await Promise.all([
      createMongoRoleRepository(),
      createMongoUserRepository(),
      getWalletSessionService(),
    ]);
    cachedService = createRoleService(repository, {
      countUsersByRoleSlug: (slug) => userRepository.countByRoleSlug(slug),
      invalidateSessionsByRoleSlug: (slug) =>
        sessionService.invalidateByRoleSlug(slug),
    });
  }
  return cachedService;
}

/** @internal Resets cached service between tests. */
export function resetRoleServiceForTests(): void {
  cachedService = null;
}
