import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildAuthenticatedUser } from "@/lib/users/testing/build-authenticated-user";
import { createAuthorService } from "./author-service";
import {
  runCreateAuthorMutation,
  runSetWalletPreferencesMutation,
  runUpdateAuthorMutation,
} from "./author-mutations";
import { WalletAuthorizationError } from "@/lib/auth/errors";
import { AuthorProfileNotFoundError } from "./errors";
import { createInMemoryAuthorRepositories } from "./testing/in-memory-repositories";

const ACCOUNT = privateKeyToAccount(generatePrivateKey());
const ADDRESS = ACCOUNT.address.toLowerCase();

vi.mock("./mutation-handler", () => ({
  verifySignedMutation: vi.fn(async (auth: { address: string }) =>
    auth.address.toLowerCase(),
  ),
}));

vi.mock("./server", () => ({
  getAuthorService: vi.fn(),
}));

vi.mock("@/lib/users/server", () => ({
  getUserService: vi.fn(),
}));

import { getUserService } from "@/lib/users/server";
import { getAuthorService } from "./server";

const mockedGetAuthorService = vi.mocked(getAuthorService);
const mockedGetUserService = vi.mocked(getUserService);

describe("author mutations", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  function mockUserService(
    getAuthenticatedByAddress: () => Promise<unknown> = async () => null,
  ) {
    mockedGetUserService.mockResolvedValue({
      promoteToAuthor: vi.fn(async (address: string) => ({
        address,
        roleSlug: "author",
      })),
      findOrCreateByWallet: vi.fn(),
      setPreferences: vi.fn(),
      assertActive: vi.fn(),
      getAuthenticatedByAddress: vi.fn(getAuthenticatedByAddress),
    } as never);
  }

  function mockService(
    getAuthenticatedByAddress: () => Promise<unknown> = async () => null,
  ) {
    const service = createAuthorService(createInMemoryAuthorRepositories());
    mockedGetAuthorService.mockResolvedValue(service);
    mockUserService(getAuthenticatedByAddress);
    return service;
  }

  it("creates an author profile", async () => {
    mockService();

    const profile = await runCreateAuthorMutation({
      address: ADDRESS,
      message: "msg",
      signature: "0x00",
      displayName: "Writer",
      avatarUrl: null,
    });

    expect(profile.displayName).toBe("Writer");
    expect(profile.address).toBe(ADDRESS);
  });

  it("allows a reader to create their first author profile", async () => {
    mockService(async () => buildAuthenticatedUser(ADDRESS, "reader"));

    const profile = await runCreateAuthorMutation({
      address: ADDRESS,
      message: "msg",
      signature: "0x00",
      displayName: "New author",
      avatarUrl: null,
    });

    expect(profile.displayName).toBe("New author");
  });

  it("updates an existing author profile", async () => {
    const service = mockService(async () => buildAuthenticatedUser(ADDRESS, "author"));
    await service.createAuthorProfile(ADDRESS, { displayName: "Before" });

    const updated = await runUpdateAuthorMutation(ADDRESS, {
      address: ADDRESS,
      message: "msg",
      signature: "0x00",
      displayName: "After",
      avatarUrl: null,
    });

    expect(updated.displayName).toBe("After");
  });

  it("rejects updates when the signer is not provisioned in the database", async () => {
    mockService();

    await expect(
      runUpdateAuthorMutation(ADDRESS, {
        address: ADDRESS,
        message: "msg",
        signature: "0x00",
        displayName: "Ghost",
        avatarUrl: null,
      }),
    ).rejects.toBeInstanceOf(WalletAuthorizationError);
  });

  it("throws when updating a missing profile", async () => {
    mockService(async () => buildAuthenticatedUser(ADDRESS, "author"));

    await expect(
      runUpdateAuthorMutation(ADDRESS, {
        address: ADDRESS,
        message: "msg",
        signature: "0x00",
        displayName: "Ghost",
        avatarUrl: null,
      }),
    ).rejects.toBeInstanceOf(AuthorProfileNotFoundError);
  });

  it("stores wallet preferences in user and author repositories", async () => {
    const service = mockService();

    const preferences = await runSetWalletPreferencesMutation(ADDRESS, {
      address: ADDRESS,
      message: "msg",
      signature: "0x00",
      declinedAuthorPage: true,
    });

    expect(preferences.declinedAuthorPage).toBe(true);
    expect(await service.getWalletPreferences(ADDRESS)).toEqual({
      declinedAuthorPage: true,
    });
  });
});
