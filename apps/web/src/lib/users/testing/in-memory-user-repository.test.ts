import { describe, expect, it } from "vitest";
import { createInMemoryUserRepository } from "./in-memory-user-repository";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";
const OTHER = "0x1234567890abcdef1234567890abcdef12345678";

describe("in-memory user repository", () => {
  it("creates, reads, updates, lists, and deletes users", async () => {
    const repository = createInMemoryUserRepository();

    expect(await repository.exists(ADDRESS)).toBe(false);

    const created = await repository.create({
      address: ADDRESS,
      role: "reader",
    });
    expect(created.role).toBe("reader");
    expect(await repository.getByAddress(ADDRESS)).toEqual(created);

    const updated = await repository.update({
      ...created,
      role: "admin",
    });
    expect(updated.role).toBe("admin");

    await repository.create({ address: OTHER, role: "author" });
    expect(await repository.list({ role: "admin" })).toEqual([updated]);

    await repository.delete(ADDRESS);
    expect(await repository.getByAddress(ADDRESS)).toBeNull();
  });
});
