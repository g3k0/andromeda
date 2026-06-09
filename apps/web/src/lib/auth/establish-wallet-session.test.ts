import { beforeEach, describe, expect, it, vi } from "vitest";
import { WalletAuthorizationError } from "./errors";
import { UserNotFoundError } from "@/lib/users/errors";
import { buildAuthenticatedUser } from "@/lib/users/testing/build-authenticated-user";

const { verifyWalletSignature, getAuthenticatedByAddress, assertActive, establish } =
  vi.hoisted(() => ({
    verifyWalletSignature: vi.fn(),
    getAuthenticatedByAddress: vi.fn(),
    assertActive: vi.fn(),
    establish: vi.fn(),
  }));

vi.mock("./verify-wallet", () => ({
  verifyWalletSignature,
}));

vi.mock("@/lib/users/server", () => ({
  getUserService: vi.fn(async () => ({
    getAuthenticatedByAddress,
    assertActive,
  })),
}));

vi.mock("./wallet-session-server", () => ({
  getWalletSessionService: vi.fn(async () => ({
    establish,
  })),
}));

import { establishWalletSession } from "./establish-wallet-session";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";
const adminUser = buildAuthenticatedUser(ADDRESS, "admin");

describe("establishWalletSession", () => {
  beforeEach(() => {
    verifyWalletSignature.mockReset();
    getAuthenticatedByAddress.mockReset();
    assertActive.mockReset();
    establish.mockReset();
  });

  it("creates a session for active admin users", async () => {
    verifyWalletSignature.mockResolvedValue(ADDRESS);
    getAuthenticatedByAddress.mockResolvedValue(adminUser);
    assertActive.mockImplementation(() => undefined);
    establish.mockResolvedValue({
      sessionId: "session-1",
      expiresAt: new Date("2026-01-01T00:30:00.000Z"),
    });

    await expect(
      establishWalletSession({
        address: ADDRESS,
        message: "message",
        signature: "0x1234",
      }),
    ).resolves.toEqual({
      sessionId: "session-1",
      expiresAt: new Date("2026-01-01T00:30:00.000Z"),
    });
  });

  it("rejects readers", async () => {
    verifyWalletSignature.mockResolvedValue(ADDRESS);
    getAuthenticatedByAddress.mockResolvedValue(
      buildAuthenticatedUser(ADDRESS, "reader"),
    );
    assertActive.mockImplementation(() => undefined);

    await expect(
      establishWalletSession({
        address: ADDRESS,
        message: "message",
        signature: "0x1234",
      }),
    ).rejects.toBeInstanceOf(WalletAuthorizationError);
  });

  it("rejects unknown users", async () => {
    verifyWalletSignature.mockResolvedValue(ADDRESS);
    getAuthenticatedByAddress.mockResolvedValue(null);

    await expect(
      establishWalletSession({
        address: ADDRESS,
        message: "message",
        signature: "0x1234",
      }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
