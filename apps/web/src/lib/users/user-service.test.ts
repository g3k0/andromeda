import { describe, expect, it } from "vitest";
import { UserExistsError, UserNotFoundError, UserSuspendedError } from "./errors";
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
});
