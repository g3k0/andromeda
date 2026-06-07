import "server-only";

import { getAuthorService } from "@/lib/authors/server";
import { createMongoUserRepository } from "./adapters/create-user-repository";
import { createUserService, type UserService } from "./user-service";

let cachedService: UserService | null = null;

export async function getUserService(): Promise<UserService> {
  if (!cachedService) {
    const repository = await createMongoUserRepository();
    cachedService = createUserService(repository, {
      hasAuthorProfile: async (address) => {
        const authorService = await getAuthorService();
        return authorService.hasAuthorProfile(address);
      },
    });
  }
  return cachedService;
}

/** @internal Resets cached service between tests. */
export function resetUserServiceForTests(): void {
  cachedService = null;
}
