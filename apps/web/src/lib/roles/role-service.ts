import {
  InvalidRolePermissionsError,
  InvalidRoleSlugError,
  RoleExistsError,
  RoleInUseError,
  RoleNotFoundError,
  SystemRoleMutationError,
} from "./errors";
import {
  assertAdminRolePermissions,
  assertKnownPermissions,
} from "./permission-utils";
import type { RoleRepository } from "./repository";
import { SYSTEM_ROLE_SEEDS } from "./seed-data";
import type {
  CreateRoleInput,
  Role,
  RoleWithUserCount,
  UpdateRoleInput,
} from "./types";
import { isValidRoleSlug } from "./types";

export type RoleUserCounter = {
  countByRoleSlug(slug: string): Promise<number>;
};

export type SessionInvalidator = {
  invalidateByRoleSlug(slug: string): Promise<void>;
};

export function createRoleService(
  roles: RoleRepository,
  options?: {
    countUsersByRoleSlug?: RoleUserCounter["countByRoleSlug"];
    invalidateSessionsByRoleSlug?: SessionInvalidator["invalidateByRoleSlug"];
  },
) {
  const countUsers =
    options?.countUsersByRoleSlug ?? (async () => 0);
  const invalidateSessions =
    options?.invalidateSessionsByRoleSlug ?? (async () => undefined);

  return {
    async list(): Promise<RoleWithUserCount[]> {
      const items = await roles.list();
      return Promise.all(
        items.map(async (role) => ({
          ...role,
          userCount: await countUsers(role.slug),
        })),
      );
    },

    async getBySlug(slug: string): Promise<RoleWithUserCount | null> {
      const role = await roles.getBySlug(slug);
      if (!role) {
        return null;
      }

      return {
        ...role,
        userCount: await countUsers(role.slug),
      };
    },

    async createRole(input: CreateRoleInput): Promise<Role> {
      if (!isValidRoleSlug(input.slug)) {
        throw new InvalidRoleSlugError(input.slug);
      }

      if (await roles.exists(input.slug)) {
        throw new RoleExistsError(input.slug);
      }

      const permissions = assertKnownPermissions(input.permissions);
      assertAdminRolePermissions(input.slug, permissions);

      if (input.isSystem) {
        throw new SystemRoleMutationError(
          "System roles cannot be created via API.",
        );
      }

      return roles.create({
        ...input,
        permissions,
        isSystem: false,
      });
    },

    async updateRole(slug: string, input: UpdateRoleInput): Promise<Role> {
      const existing = await roles.getBySlug(slug);
      if (!existing) {
        throw new RoleNotFoundError(slug);
      }

      const nextPermissions = input.permissions
        ? assertKnownPermissions(input.permissions)
        : existing.permissions;
      assertAdminRolePermissions(slug, nextPermissions);

      const updated = await roles.update(slug, {
        name: input.name ?? existing.name,
        description:
          input.description !== undefined
            ? input.description
            : existing.description,
        permissions: nextPermissions,
      });

      if (input.permissions) {
        await invalidateSessions(slug);
      }

      return updated;
    },

    async deleteRole(slug: string): Promise<void> {
      const existing = await roles.getBySlug(slug);
      if (!existing) {
        throw new RoleNotFoundError(slug);
      }

      if (existing.isSystem) {
        throw new SystemRoleMutationError("System roles cannot be deleted.");
      }

      const userCount = await countUsers(slug);
      if (userCount > 0) {
        throw new RoleInUseError(slug, userCount);
      }

      await roles.delete(slug);
    },

    async seedSystemRoles(): Promise<Role[]> {
      const seeded: Role[] = [];

      for (const seed of SYSTEM_ROLE_SEEDS) {
        if (await roles.exists(seed.slug)) {
          const existing = await roles.getBySlug(seed.slug);
          if (existing) {
            seeded.push(existing);
          }
          continue;
        }

        const permissions = assertKnownPermissions(seed.permissions);
        assertAdminRolePermissions(seed.slug, permissions);
        seeded.push(
          await roles.create({
            ...seed,
            permissions,
            isSystem: true,
          }),
        );
      }

      return seeded;
    },

    assertRoleExists(slug: string, role: Role | null): Role {
      if (!role) {
        throw new RoleNotFoundError(slug);
      }
      return role;
    },
  };
}

export type RoleService = ReturnType<typeof createRoleService>;
