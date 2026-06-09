/**
 * One-off migration: seed `users` from admins env, authors, and walletpreferences.
 *
 * Usage (from repo root):
 *   pnpm --filter @andromeda/web exec tsx scripts/migrate-users.ts
 */
import { loadEnvConfig } from "@next/env";
import { parseAdminAddresses } from "@/lib/auth/admin";
import { connectMongo } from "@/lib/db/mongodb";
import { AuthorModel } from "@/lib/db/models/author.model";
import { WalletPreferencesModel } from "@/lib/db/models/wallet-preferences.model";
import { UserModel } from "@/lib/db/models/user.model";

loadEnvConfig(process.cwd());

async function upsertUser(
  address: string,
  role: "admin" | "author" | "reader",
  preferences?: {
    declinedAuthorPage?: boolean;
    onboardingCompletedAt?: Date | null;
  },
) {
  const existing = await UserModel.findOne({ address }).lean();
  const nextRoleSlug =
    existing?.roleSlug === "admin" || role === "admin"
      ? "admin"
      : existing?.roleSlug === "author" || role === "author"
        ? "author"
        : "reader";

  await UserModel.updateOne(
    { address },
    {
      $set: {
        roleSlug: nextRoleSlug,
        status: "active",
        ...(preferences
          ? {
              preferences: {
                declinedAuthorPage: preferences.declinedAuthorPage ?? false,
                onboardingCompletedAt: preferences.onboardingCompletedAt ?? null,
              },
            }
          : {}),
      },
      $setOnInsert: {
        permissionOverrides: [],
        metadata: { migratedAt: new Date().toISOString() },
      },
    },
    { upsert: true },
  );
}

async function main() {
  await connectMongo();

  const adminAddresses = parseAdminAddresses(
    process.env.ADMIN_ADDRESSES ?? process.env.NEXT_PUBLIC_ADMIN_ADDRESSES,
  );

  for (const address of adminAddresses) {
    await upsertUser(address, "admin");
    console.log(`Upserted admin user ${address}`);
  }

  const authors = await AuthorModel.find({}, { address: 1 }).lean();
  for (const author of authors) {
    await upsertUser(author.address, "author");
    console.log(`Upserted author user ${author.address}`);
  }

  const preferences = await WalletPreferencesModel.find().lean();
  for (const pref of preferences) {
    await upsertUser(pref.address, "reader", {
      declinedAuthorPage: pref.declinedAuthorPage,
      onboardingCompletedAt: pref.onboardingCompletedAt ?? null,
    });
    console.log(`Migrated preferences for ${pref.address}`);
  }

  console.log("User migration completed.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
