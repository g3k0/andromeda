import type { RoleRepository } from "../repository";
import type { CreateRoleInput, Role, UpdateRoleInput } from "../types";

export function createInMemoryRoleRepository(
  seed: Role[] = [],
): RoleRepository {
  const roles = new Map<string, Role>(
    seed.map((role) => [role.slug, { ...role }]),
  );

  return {
    async list() {
      return [...roles.values()].sort((left, right) =>
        left.name.localeCompare(right.name),
      );
    },

    async getBySlug(slug: string) {
      return roles.get(slug) ?? null;
    },

    async exists(slug: string) {
      return roles.has(slug);
    },

    async create(input: CreateRoleInput) {
      const now = new Date().toISOString();
      const role: Role = {
        slug: input.slug,
        name: input.name,
        description: input.description ?? null,
        permissions: input.permissions,
        isSystem: input.isSystem ?? false,
        createdAt: now,
        updatedAt: now,
      };
      roles.set(input.slug, role);
      return role;
    },

    async update(slug: string, input: UpdateRoleInput) {
      const existing = roles.get(slug);
      if (!existing) {
        throw new Error(`Role missing for ${slug}`);
      }

      const updated: Role = {
        ...existing,
        name: input.name ?? existing.name,
        description:
          input.description !== undefined
            ? input.description
            : existing.description,
        permissions: input.permissions ?? existing.permissions,
        updatedAt: new Date().toISOString(),
      };
      roles.set(slug, updated);
      return updated;
    },

    async delete(slug: string) {
      roles.delete(slug);
    },
  };
}
