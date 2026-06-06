import { describe, expect, it } from "vitest";
import { createAuthorService } from "./author-service";
import {
  AuthorProfileExistsError,
  AuthorProfileNotFoundError,
  InvalidAddressError,
} from "./errors";
import { createInMemoryAuthorRepositories } from "./testing/in-memory-repositories";

const VALID = "0xabcdef0123456789abcdef0123456789abcdef01";

describe("author-service", () => {
  function service() {
    return createAuthorService(createInMemoryAuthorRepositories());
  }

  it("returns null when no profile exists", async () => {
    const svc = service();
    expect(await svc.getAuthorByAddress(VALID)).toBeNull();
    expect(await svc.hasAuthorProfile(VALID)).toBe(false);
  });

  it("creates and updates profiles", async () => {
    const svc = service();
    const created = await svc.createAuthorProfile(VALID, {
      displayName: "Before",
    });
    const updated = await svc.upsertAuthor({
      ...created,
      displayName: "After",
      avatarUrl: "data:image/png;base64,abc",
    });

    expect(updated.displayName).toBe("After");
    expect(updated.createdAt).toBe(created.createdAt);
    expect(await svc.getAuthorByAddress(VALID)).toEqual(updated);
  });

  it("throws when creating duplicate profiles", async () => {
    const svc = service();
    await svc.createAuthorProfile(VALID);
    await expect(svc.createAuthorProfile(VALID)).rejects.toBeInstanceOf(
      AuthorProfileExistsError,
    );
  });

  it("throws when updating missing profiles", async () => {
    const svc = service();
    await expect(
      svc.upsertAuthor({
        address: VALID,
        displayName: "Ghost",
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      }),
    ).rejects.toBeInstanceOf(AuthorProfileNotFoundError);
  });

  it("throws for invalid addresses on mutations", async () => {
    const svc = service();
    await expect(svc.createAuthorProfile("bad")).rejects.toBeInstanceOf(
      InvalidAddressError,
    );
  });

  it("stores wallet preferences per address", async () => {
    const svc = service();
    expect(await svc.getWalletPreferences(VALID)).toBeNull();
    await svc.setWalletPreferences(VALID, { declinedAuthorPage: true });
    expect(await svc.getWalletPreferences(VALID)).toEqual({
      declinedAuthorPage: true,
    });
  });
});
