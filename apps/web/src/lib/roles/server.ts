import "server-only";

import { createMongoRoleRepository } from "./adapters/create-role-repository";
import { createRoleService, type RoleService } from "./role-service";

let cachedService: RoleService | null = null;

export async function getRoleService(): Promise<RoleService> {
  if (!cachedService) {
    const repository = await createMongoRoleRepository();
    cachedService = createRoleService(repository);
  }
  return cachedService;
}

/** @internal Resets cached service between tests. */
export function resetRoleServiceForTests(): void {
  cachedService = null;
}
