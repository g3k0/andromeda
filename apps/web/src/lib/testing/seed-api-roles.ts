import { createMongoRoleRepository } from "@/lib/roles/adapters/create-role-repository";
import { seedSystemRoles } from "@/lib/roles/testing/seed-system-roles";

export async function seedApiSystemRoles(): Promise<void> {
  const repository = await createMongoRoleRepository();
  await seedSystemRoles(repository);
}
