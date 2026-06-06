import type { UserRole } from "@/lib/auth/roles";

export type UserRoleDefinition = {
  role: UserRole;
  summary: string;
  canRead: boolean;
  canEditOwnAuthorPage: boolean;
  canEditAnyAuthorPage: boolean;
  canAccessAdminArea: boolean;
};

export const USER_ROLE_DEFINITIONS: readonly UserRoleDefinition[] = [
  {
    role: "reader",
    summary: "Connected wallet without an author profile (or declined page creation).",
    canRead: true,
    canEditOwnAuthorPage: false,
    canEditAnyAuthorPage: false,
    canAccessAdminArea: false,
  },
  {
    role: "author",
    summary: "Connected wallet with a created author profile.",
    canRead: true,
    canEditOwnAuthorPage: true,
    canEditAnyAuthorPage: false,
    canAccessAdminArea: false,
  },
  {
    role: "admin",
    summary:
      "Wallet listed in NEXT_PUBLIC_ADMIN_ADDRESSES; includes reader and author capabilities.",
    canRead: true,
    canEditOwnAuthorPage: true,
    canEditAnyAuthorPage: true,
    canAccessAdminArea: true,
  },
] as const;

export const DATABASE_PERSISTENCE_NOTES: readonly string[] = [
  "Author profiles and wallet preferences are stored in MongoDB via Mongoose adapters.",
  "Mutations require a signed wallet message verified server-side.",
  "MONGODB_URI must be configured via gitignored env files or deployment secrets.",
  "Avatar uploads are stored as validated data URLs until IPFS integration.",
] as const;

export const DATABASE_MIGRATION_STATUS = {
  collections: {
    authors: ["address", "displayName", "avatarUrl", "createdAt", "updatedAt"],
    wallet_preferences: [
      "address",
      "declinedAuthorPage",
      "onboardingCompletedAt",
    ],
  },
  api: {
    getAuthor: "GET /api/authors/:address",
    createAuthor: "POST /api/authors",
    patchAuthor: "PATCH /api/authors/:address",
    putWalletPreferences: "PUT /api/wallet-preferences/:address",
  },
  authorization:
    "Mutations require EIP-191 wallet signatures; admin edits verified server-side.",
  modulesToKeep: [
    "roles.ts",
    "components/author/*",
    "lib/auth/admin.ts",
    "author-service.ts",
  ],
} as const;

export function getUserRoleDefinition(role: UserRole): UserRoleDefinition {
  const definition = USER_ROLE_DEFINITIONS.find((entry) => entry.role === role);
  if (!definition) {
    throw new Error(`Unknown user role: ${role}`);
  }
  return definition;
}
