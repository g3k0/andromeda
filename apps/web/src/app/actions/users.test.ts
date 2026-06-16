import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findOrCreateByWallet,
  getSnapshot,
  hasAuthorProfile,
  resolveAuthorizedSnapshotWallet,
} = vi.hoisted(() => ({
  findOrCreateByWallet: vi.fn(),
  getSnapshot: vi.fn(),
  hasAuthorProfile: vi.fn(),
  resolveAuthorizedSnapshotWallet: vi.fn(),
}));

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

vi.mock("@/lib/auth/resolve-snapshot-wallet", () => ({
  resolveAuthorizedSnapshotWallet,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: () => null,
  })),
}));

import { getUserSnapshotAction } from "./users";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

describe("user server actions", () => {
  beforeEach(() => {
    findOrCreateByWallet.mockReset();
    getSnapshot.mockReset();
    hasAuthorProfile.mockReset();
    resolveAuthorizedSnapshotWallet.mockReset();
  });

  it("returns null when wallet is disconnected", async () => {
    await expect(getUserSnapshotAction(undefined, false)).resolves.toBeNull();
    expect(findOrCreateByWallet).not.toHaveBeenCalled();
  });

  it("returns null when the wallet is not authorized", async () => {
    resolveAuthorizedSnapshotWallet.mockResolvedValue(null);

    await expect(getUserSnapshotAction(ADDRESS, true)).resolves.toBeNull();
    expect(findOrCreateByWallet).not.toHaveBeenCalled();
  });

  it("ensures user exists before building a snapshot", async () => {
    resolveAuthorizedSnapshotWallet.mockResolvedValue(ADDRESS);
    getSnapshot.mockResolvedValue({
      normalizedAddress: ADDRESS,
      isConnected: true,
      roleSlug: "reader",
      roleName: "Reader",
      status: "active",
      permissions: ["pages:read"],
      hasAuthorProfile: false,
      declinedAuthorPage: false,
    });

    const snapshot = await getUserSnapshotAction(ADDRESS, true);

    expect(findOrCreateByWallet).toHaveBeenCalledWith(ADDRESS);
    expect(getSnapshot).toHaveBeenCalledWith(ADDRESS, true, {
      hasAuthorProfile: expect.any(Function),
    });
    expect(snapshot?.roleSlug).toBe("reader");
    expect(snapshot?.permissions).toContain("pages:read");
  });
});
