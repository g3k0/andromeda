import { describe, expect, it } from "vitest";
import { createInMemoryRoleRepository } from "@/lib/roles/testing/in-memory-role-repository";
import { seedSystemRoles } from "@/lib/roles/testing/seed-system-roles";
import {
  InvalidUserRoleTransitionError,
  UserExistsError,
  UserNotFoundError,
  UserSuspendedError,
} from "./errors";
import { createInMemoryUserRepository } from "./testing/in-memory-user-repository";
import { createUserService, type UserServiceOptions } from "./user-service";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

async function createTestUserService(options?: UserServiceOptions) {
  const roles = createInMemoryRoleRepository();
  await seedSystemRoles(roles);
  return createUserService(createInMemoryUserRepository(), roles, options);
}

async function createSeededUserService(
  users = createInMemoryUserRepository(),
  options?: UserServiceOptions,
) {
  const roles = createInMemoryRoleRepository();
  await seedSystemRoles(roles);
  return createUserService(users, roles, options);
}

describe("user service", () => {
  it("finds or creates a reader on first wallet connect", async () => {
    const service = await createTestUserService();

    const created = await service.findOrCreateByWallet(ADDRESS);
    expect(created.roleSlug).toBe("reader");

    const again = await service.findOrCreateByWallet(ADDRESS);
    expect(again.address).toBe(created.address);
  });

  it("creates an author when the wallet already has an author profile", async () => {
    const service = await createTestUserService({
      authorLookup: { hasAuthorProfile: async () => true },
    });

    const created = await service.findOrCreateByWallet(ADDRESS);
    expect(created.roleSlug).toBe("author");
  });

  it("syncs an existing reader to author when an author profile exists", async () => {
    const repository = createInMemoryUserRepository();
    const service = await createSeededUserService(repository, {
      authorLookup: { hasAuthorProfile: async () => true },
    });

    await repository.create({ address: ADDRESS, roleSlug: "reader" });

    const snapshot = await service.getSnapshot(ADDRESS, true);
    expect(snapshot?.roleSlug).toBe("author");

    const stored = await repository.getByAddress(ADDRESS);
    expect(stored?.roleSlug).toBe("author");
  });

  it("builds a connected snapshot with author profile lookup", async () => {
    const repository = createInMemoryUserRepository();
    const service = await createSeededUserService(repository, {
      authorLookup: { hasAuthorProfile: async () => true },
    });

    await repository.create({ address: ADDRESS, roleSlug: "author" });

    const snapshot = await service.getSnapshot(ADDRESS, true);
    expect(snapshot).toEqual({
      normalizedAddress: ADDRESS,
      isConnected: true,
      roleSlug: "author",
      roleName: "Author",
      status: "active",
      permissions: ["pages:read", "authors:write:own"],
      hasAuthorProfile: true,
      declinedAuthorPage: false,
    });
  });

  it("promotes and demotes non-admin roles", async () => {
    const service = await createTestUserService();
    await service.findOrCreateByWallet(ADDRESS);

    const author = await service.promoteToAuthor(ADDRESS);
    expect(author.roleSlug).toBe("author");

    const reader = await service.demoteToReader(ADDRESS);
    expect(reader.roleSlug).toBe("reader");
  });

  it("blocks mutations for suspended users", async () => {
    const repository = createInMemoryUserRepository();
    const service = await createSeededUserService(repository);
    const user = await repository.create({
      address: ADDRESS,
      roleSlug: "reader",
      status: "suspended",
    });

    expect(() => service.assertActive(user)).toThrow(UserSuspendedError);
    await expect(service.promoteToAuthor(ADDRESS)).rejects.toBeInstanceOf(
      UserSuspendedError,
    );
  });

  it("rejects duplicate user creation", async () => {
    const service = await createTestUserService();
    await service.findOrCreateByWallet(ADDRESS);

    await expect(
      service.createUser({ address: ADDRESS }),
    ).rejects.toBeInstanceOf(UserExistsError);
  });

  it("throws when updating a missing user", async () => {
    const service = await createTestUserService();
    await expect(service.deleteUser(ADDRESS)).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
  });

  it("blocks promoting to author without an author profile", async () => {
    const repository = createInMemoryUserRepository();
    const service = await createSeededUserService(repository, {
      authorLookup: { hasAuthorProfile: async () => false },
    });
    await repository.create({ address: ADDRESS, roleSlug: "reader" });

    await expect(service.setRoleSlug(ADDRESS, "author")).rejects.toBeInstanceOf(
      InvalidUserRoleTransitionError,
    );
  });

  it("allows promoting to author when a profile exists", async () => {
    const service = await createTestUserService({
      authorLookup: { hasAuthorProfile: async () => true },
    });
    await service.findOrCreateByWallet(ADDRESS);

    const author = await service.setRoleSlug(ADDRESS, "author");
    expect(author.roleSlug).toBe("author");
  });
});
