import { describe, expect, it, vi } from "vitest";
import {
  InvalidRolePermissionsError,
  RoleExistsError,
  RoleInUseError,
  RoleNotFoundError,
  SystemRoleMutationError,
} from "./errors";
import { createRoleService } from "./role-service";
import { SYSTEM_ROLE_SEEDS } from "./seed-data";
import { createInMemoryRoleRepository } from "./testing/in-memory-role-repository";

describe("role service", () => {
  it("seeds system roles idempotently", async () => {
    const service = createRoleService(createInMemoryRoleRepository());

    const first = await service.seedSystemRoles();
    const second = await service.seedSystemRoles();

    expect(first).toHaveLength(SYSTEM_ROLE_SEEDS.length);
    expect(second).toHaveLength(SYSTEM_ROLE_SEEDS.length);
    expect(second.map((role) => role.slug)).toEqual(
      SYSTEM_ROLE_SEEDS.map((seed) => seed.slug),
    );
  });

  it("creates custom roles with validated permissions", async () => {
    const service = createRoleService(createInMemoryRoleRepository());
    await service.seedSystemRoles();

    const role = await service.createRole({
      slug: "moderator",
      name: "Moderator",
      permissions: ["pages:read", "authors:write:any"],
    });

    expect(role.slug).toBe("moderator");
    expect(role.isSystem).toBe(false);
  });

  it("rejects duplicate role slugs", async () => {
    const service = createRoleService(createInMemoryRoleRepository());
    await service.seedSystemRoles();

    await expect(
      service.createRole({
        slug: "reader",
        name: "Duplicate",
        permissions: ["pages:read"],
      }),
    ).rejects.toBeInstanceOf(RoleExistsError);
  });

  it("prevents admin role lock-out", async () => {
    const service = createRoleService(createInMemoryRoleRepository());
    await service.seedSystemRoles();

    await expect(
      service.updateRole("admin", { permissions: ["pages:read"] }),
    ).rejects.toBeInstanceOf(InvalidRolePermissionsError);
  });

  it("invalidates sessions when permissions change", async () => {
    const invalidateSessionsByRoleSlug = vi.fn();
    const service = createRoleService(createInMemoryRoleRepository(), {
      invalidateSessionsByRoleSlug,
    });
    await service.seedSystemRoles();

    await service.updateRole("reader", {
      permissions: ["pages:read", "roles:read"],
    });

    expect(invalidateSessionsByRoleSlug).toHaveBeenCalledWith("reader");
  });

  it("blocks deleting system roles and roles in use", async () => {
    const service = createRoleService(createInMemoryRoleRepository(), {
      countUsersByRoleSlug: async (slug) => (slug === "moderator" ? 2 : 0),
    });
    await service.seedSystemRoles();
    await service.createRole({
      slug: "moderator",
      name: "Moderator",
      permissions: ["pages:read"],
    });

    await expect(service.deleteRole("admin")).rejects.toBeInstanceOf(
      SystemRoleMutationError,
    );
    await expect(service.deleteRole("moderator")).rejects.toBeInstanceOf(
      RoleInUseError,
    );
  });

  it("deletes unused custom roles", async () => {
    const service = createRoleService(createInMemoryRoleRepository());
    await service.seedSystemRoles();
    await service.createRole({
      slug: "moderator",
      name: "Moderator",
      permissions: ["pages:read"],
    });

    await service.deleteRole("moderator");
    await expect(service.getBySlug("moderator")).resolves.toBeNull();
  });

  it("throws when role is missing", async () => {
    const service = createRoleService(createInMemoryRoleRepository());

    await expect(service.updateRole("missing", { name: "X" })).rejects.toBeInstanceOf(
      RoleNotFoundError,
    );
  });
});
