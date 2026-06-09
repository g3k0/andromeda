/**
 * Seed system roles in MongoDB.
 *
 * Usage (from apps/web):
 *   pnpm exec tsx scripts/seed-roles.ts
 */
import { loadEnvConfig } from "@next/env";
import { createMongoRoleRepository } from "@/lib/roles/adapters/create-role-repository";
import { createRoleService } from "@/lib/roles/role-service";
import { connectMongo } from "@/lib/db/mongodb";

loadEnvConfig(process.cwd());

async function main() {
  await connectMongo();
  const repository = await createMongoRoleRepository();
  const service = createRoleService(repository);
  const roles = await service.seedSystemRoles();

  for (const role of roles) {
    console.log(`Seeded role ${role.slug} (${role.permissions.length} permissions)`);
  }

  console.log("Role seed completed.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
