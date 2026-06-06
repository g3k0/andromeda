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

import { getAuthorService } from "./server";

const mockedGetAuthorService = vi.mocked(getAuthorService);

describe("author mutations", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  function mockService() {
    const service = createAuthorService(createInMemoryAuthorRepositories());
    mockedGetAuthorService.mockResolvedValue(service);
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
