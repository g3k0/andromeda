import type { UserPermission } from "@/lib/users/types";
import { USER_PERMISSIONS } from "@/lib/users/types";
import type { CreateRoleInput } from "./types";

export const ADMIN_ROLE_SLUG = "admin";
export const AUTHOR_ROLE_SLUG = "author";
export const READER_ROLE_SLUG = "reader";

export const ADMIN_REQUIRED_PERMISSIONS: UserPermission[] = [
  "admin:access",
  "users:write",
  "roles:write",
];

export const SYSTEM_ROLE_SEEDS: CreateRoleInput[] = [
  {
    slug: READER_ROLE_SLUG,
    name: "Reader",
    description: "Default platform reader",
    permissions: ["pages:read"],
    isSystem: true,
  },
  {
    slug: AUTHOR_ROLE_SLUG,
    name: "Author",
    description: "Author with own profile editing",
    permissions: ["pages:read", "authors:write:own"],
    isSystem: true,
  },
  {
    slug: ADMIN_ROLE_SLUG,
    name: "Admin",
    description: "Full platform administration",
    permissions: [...USER_PERMISSIONS],
    isSystem: true,
  },
];
