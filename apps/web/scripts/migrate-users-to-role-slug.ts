/**
 * Migrate legacy `users.role` / `users.permissions` to `roleSlug` / `permissionOverrides`.
 *
 * Usage (from apps/web):
 *   pnpm exec tsx scripts/migrate-users-to-role-slug.ts
 */
import { loadEnvConfig } from "@next/env";
import { connectMongo } from "@/lib/db/mongodb";
import { UserModel } from "@/lib/db/models/user.model";

loadEnvConfig(process.cwd());

async function main() {
  await connectMongo();

  const users = await UserModel.find({}).lean();
  let migrated = 0;

  for (const user of users) {
    const legacy = user as {
      role?: string;
      roleSlug?: string;
      permissions?: string[];
      permissionOverrides?: string[];
    };

    const roleSlug = legacy.roleSlug ?? legacy.role ?? "reader";
    const permissionOverrides =
      legacy.permissionOverrides ?? legacy.permissions ?? [];

    await UserModel.updateOne(
      { _id: user._id },
      {
        $set: {
          roleSlug,
          permissionOverrides,
        },
        $unset: {
          role: "",
          permissions: "",
        },
      },
    );
    migrated += 1;
    console.log(`Migrated user ${user.address} -> roleSlug=${roleSlug}`);
  }

  console.log(`User roleSlug migration completed (${migrated} documents).`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
