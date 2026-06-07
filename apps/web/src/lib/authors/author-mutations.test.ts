import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAuthorService } from "./author-service";
import {
  runCreateAuthorMutation,
  runSetWalletPreferencesMutation,
  runUpdateAuthorMutation,
} from "./author-mutations";
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
    getByAddress: () => Promise<unknown> = async () => null,
  ) {
    mockedGetUserService.mockResolvedValue({
      promoteToAuthor: vi.fn(async (address: string) => ({
        address,
        role: "author",
      })),
      findOrCreateByWallet: vi.fn(),
      setPreferences: vi.fn(),
      assertActive: vi.fn(),
      getByAddress: vi.fn(getByAddress),
    } as never);
  }

  function mockService(
    getByAddress: () => Promise<unknown> = async () => null,
  ) {
    const service = createAuthorService(createInMemoryAuthorRepositories());
    mockedGetAuthorService.mockResolvedValue(service);
    mockUserService(getByAddress);
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
    mockService(async () => ({
      address: ADDRESS,
      role: "reader",
      status: "active",
      permissions: [],
      preferences: { declinedAuthorPage: false, onboardingCompletedAt: null },
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

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
    const service = mockService();
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

  it("throws when updating a missing profile", async () => {
    mockService();

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

  it("stores wallet preferences", async () => {
    mockService();

    const preferences = await runSetWalletPreferencesMutation(ADDRESS, {
      address: ADDRESS,
      message: "msg",
      signature: "0x00",
      declinedAuthorPage: true,
    });

    expect(preferences.declinedAuthorPage).toBe(true);
  });
});
