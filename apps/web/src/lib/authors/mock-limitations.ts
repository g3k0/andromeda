import type { UserRole } from "@/lib/auth/roles";
import {
  AUTHORS_RECORD_STORAGE_KEY,
  WALLET_PREFERENCES_KEY_PREFIX,
  walletPreferencesStorageKey,
} from "./storage-keys";

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

export const MOCK_PERSISTENCE_LIMITATIONS: readonly string[] = [
  "Author profiles and wallet preferences are stored in the browser only (localStorage).",
  "Data does not sync across devices, browsers, or users.",
  "Clearing site data removes profiles and onboarding preferences.",
  "There is no server-side validation of profile updates in this iteration.",
  "Avatar uploads are stored as data URLs in localStorage, not on IPFS or object storage.",
] as const;

export const FUTURE_DATABASE_MIGRATION = {
  tables: {
    authors: ["address", "display_name", "avatar_url", "created_at", "updated_at"],
    wallet_preferences: [
      "address",
      "declined_author_page",
      "onboarding_completed_at",
    ],
  },
  api: {
    getAuthor: "GET /authors/:address",
    createAuthor: "POST /authors",
    patchAuthor: "PATCH /authors/:address",
  },
  authorization:
    "PATCH requires wallet signature from the profile owner or a server-verified admin allowlist.",
  modulesToReplace: ["mock-store.ts"],
  modulesToKeep: ["roles.ts", "components/author/*", "lib/auth/admin.ts"],
} as const;

export function getAuthorMockStorageKeys() {
  return {
    authorsRecord: AUTHORS_RECORD_STORAGE_KEY,
    walletPreferencesPrefix: WALLET_PREFERENCES_KEY_PREFIX,
    walletPreferencesFor: walletPreferencesStorageKey,
  };
}

export function usesBrowserLocalStorageForMock(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function getUserRoleDefinition(role: UserRole): UserRoleDefinition {
  const definition = USER_ROLE_DEFINITIONS.find((entry) => entry.role === role);
  if (!definition) {
    throw new Error(`Unknown user role: ${role}`);
  }
  return definition;
}
