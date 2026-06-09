import { describe, expect, it } from "vitest";
import {
  InvalidUserRoleTransitionError,
  UserExistsError,
  UserNotFoundError,
  UserSuspendedError,
} from "./errors";
import { createInMemoryUserRepository } from "./testing/in-memory-user-repository";
import { createUserService } from "./user-service";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

describe("user service", () => {
  it("finds or creates a reader on first wallet connect", async () => {
    const service = createUserService(createInMemoryUserRepository());

    const created = await service.findOrCreateByWallet(ADDRESS);
    expect(created.role).toBe("reader");

    const again = await service.findOrCreateByWallet(ADDRESS);
    expect(again.address).toBe(created.address);
  });

  it("creates an author when the wallet already has an author profile", async () => {
    const service = createUserService(createInMemoryUserRepository(), {
      hasAuthorProfile: async () => true,
    });

    const created = await service.findOrCreateByWallet(ADDRESS);
    expect(created.role).toBe("author");
  });

  it("syncs an existing reader to author when an author profile exists", async () => {
    const repository = createInMemoryUserRepository();
    const service = createUserService(repository, {
      hasAuthorProfile: async () => true,
    });

    await repository.create({ address: ADDRESS, role: "reader" });

    const snapshot = await service.getSnapshot(ADDRESS, true);
    expect(snapshot?.role).toBe("author");

    const stored = await repository.getByAddress(ADDRESS);
    expect(stored?.role).toBe("author");
  });

  it("builds a connected snapshot with author profile lookup", async () => {
    const repository = createInMemoryUserRepository();
    const service = createUserService(repository, {
      hasAuthorProfile: async () => true,
    });

    await repository.create({ address: ADDRESS, role: "author" });

    const snapshot = await service.getSnapshot(ADDRESS, true);
    expect(snapshot).toEqual({
      normalizedAddress: ADDRESS,
      isConnected: true,
      role: "author",
      status: "active",
      hasAuthorProfile: true,
      declinedAuthorPage: false,
    });
  });

  it("promotes and demotes non-admin roles", async () => {
    const service = createUserService(createInMemoryUserRepository());
    await service.findOrCreateByWallet(ADDRESS);

    const author = await service.promoteToAuthor(ADDRESS);
    expect(author.role).toBe("author");

    const reader = await service.demoteToReader(ADDRESS);
    expect(reader.role).toBe("reader");
  });

  it("blocks mutations for suspended users", async () => {
    const repository = createInMemoryUserRepository();
    const service = createUserService(repository);
    const user = await repository.create({
      address: ADDRESS,
      role: "reader",
      status: "suspended",
    });

    expect(() => service.assertActive(user)).toThrow(UserSuspendedError);
    await expect(service.promoteToAuthor(ADDRESS)).rejects.toBeInstanceOf(
      UserSuspendedError,
    );
  });

  it("rejects duplicate user creation", async () => {
    const service = createUserService(createInMemoryUserRepository());
    await service.findOrCreateByWallet(ADDRESS);

    await expect(
      service.createUser({ address: ADDRESS }),
    ).rejects.toBeInstanceOf(UserExistsError);
  });

  it("throws when updating a missing user", async () => {
    const service = createUserService(createInMemoryUserRepository());
    await expect(service.deleteUser(ADDRESS)).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
  });

  it("blocks promoting to author without an author profile", async () => {
    const repository = createInMemoryUserRepository();
    const service = createUserService(repository, {
      hasAuthorProfile: async () => false,
    });
    await repository.create({ address: ADDRESS, role: "reader" });

    await expect(service.setRole(ADDRESS, "author")).rejects.toBeInstanceOf(
      InvalidUserRoleTransitionError,
    );
  });

  it("allows promoting to author when a profile exists", async () => {
    const service = createUserService(createInMemoryUserRepository(), {
      hasAuthorProfile: async () => true,
    });
    await service.findOrCreateByWallet(ADDRESS);

    const author = await service.setRole(ADDRESS, "author");
    expect(author.role).toBe("author");
  });
});
