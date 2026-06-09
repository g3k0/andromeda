import type { AuthenticatedUser } from "@/lib/users/types";
import { defaultUserPreferences } from "@/lib/users/types";
import type { WalletSessionSnapshot } from "./wallet-session-store";

export function authenticatedUserFromSessionSnapshot(
  snapshot: WalletSessionSnapshot,
): AuthenticatedUser {
  const now = new Date(0).toISOString();

  return {
    address: snapshot.address,
    roleSlug: snapshot.roleSlug,
    status: snapshot.status,
    permissionOverrides: [],
    preferences: defaultUserPreferences(),
    metadata: {},
    createdAt: now,
    updatedAt: now,
    permissions: snapshot.permissions,
    role: {
      slug: snapshot.roleSlug,
      name: snapshot.roleSlug,
      description: null,
      permissions: snapshot.permissions,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    },
  };
}
