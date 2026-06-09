import { SYSTEM_ROLE_SEEDS } from "@/lib/roles/seed-data";
import type { UserPermission } from "./types";

export function defaultPermissionsForRoleSlug(
  roleSlug: string,
): UserPermission[] {
  const seed = SYSTEM_ROLE_SEEDS.find((entry) => entry.slug === roleSlug);
  return seed?.permissions ?? ["pages:read"];
}
