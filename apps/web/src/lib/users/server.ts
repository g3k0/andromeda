import "server-only";

import { getAuthorService } from "@/lib/authors/server";
import { getWalletSessionService } from "@/lib/auth/wallet-session-server";
import { createMongoRoleRepository } from "@/lib/roles/adapters/create-role-repository";
import { createMongoUserRepository } from "./adapters/create-user-repository";
import { createUserService, type UserService } from "./user-service";

let cachedService: UserService | null = null;

export async function getUserService(): Promise<UserService> {
  if (!cachedService) {
    const repository = await createMongoUserRepository();
    const roleRepository = await createMongoRoleRepository();
    const sessionService = await getWalletSessionService();
    cachedService = createUserService(repository, roleRepository, {
      authorLookup: {
        hasAuthorProfile: async (address) => {
          const authorService = await getAuthorService();
          return authorService.hasAuthorProfile(address);
        },
      },
      invalidateUserSessions: (address) =>
        sessionService.invalidateByAddress(address),
    });
  }
  return cachedService;
}

/** @internal Resets cached service between tests. */
export function resetUserServiceForTests(): void {
  cachedService = null;
}
