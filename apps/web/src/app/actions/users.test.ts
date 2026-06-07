import { beforeEach, describe, expect, it, vi } from "vitest";

const findOrCreateByWallet = vi.fn();
const getSnapshot = vi.fn();
const hasAuthorProfile = vi.fn();

vi.mock("@/lib/users/server", () => ({
  getUserService: vi.fn(async () => ({
    findOrCreateByWallet,
    getSnapshot,
  })),
}));

vi.mock("@/lib/authors/server", () => ({
  getAuthorService: vi.fn(async () => ({
    hasAuthorProfile,
  })),
}));

import {
  findOrCreateUserOnConnectAction,
  getUserSnapshotAction,
} from "./users";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

describe("user server actions", () => {
  beforeEach(() => {
    findOrCreateByWallet.mockReset();
    getSnapshot.mockReset();
    hasAuthorProfile.mockReset();
  });

  it("returns null when wallet is disconnected", async () => {
    await expect(findOrCreateUserOnConnectAction(undefined)).resolves.toBeNull();
    expect(findOrCreateByWallet).not.toHaveBeenCalled();
  });

  it("finds or creates a user on connect", async () => {
    findOrCreateByWallet.mockResolvedValue({ address: ADDRESS, role: "reader" });

    await findOrCreateUserOnConnectAction(ADDRESS);

    expect(findOrCreateByWallet).toHaveBeenCalledWith(ADDRESS);
  });

  it("ensures user exists before building a snapshot", async () => {
    getSnapshot.mockResolvedValue({
      normalizedAddress: ADDRESS,
      isConnected: true,
      role: "reader",
      status: "active",
      hasAuthorProfile: false,
      declinedAuthorPage: false,
    });

    const snapshot = await getUserSnapshotAction(ADDRESS, true);

    expect(findOrCreateByWallet).toHaveBeenCalledWith(ADDRESS);
    expect(getSnapshot).toHaveBeenCalledWith(ADDRESS, true, {
      hasAuthorProfile: expect.any(Function),
    });
    expect(snapshot?.role).toBe("reader");
  });
});
