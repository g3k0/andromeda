import { createRoleService } from "../role-service";
import type { RoleRepository } from "../repository";

export async function seedSystemRoles(repository: RoleRepository) {
  const service = createRoleService(repository);
  return service.seedSystemRoles();
}
