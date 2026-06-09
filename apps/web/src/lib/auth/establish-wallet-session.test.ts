import { beforeEach, describe, expect, it, vi } from "vitest";
import { WalletAuthorizationError } from "./errors";
import { UserNotFoundError } from "@/lib/users/errors";

const { verifyWalletSignature, getByAddress, assertActive, establish } = vi.hoisted(
  () => ({
    verifyWalletSignature: vi.fn(),
    getByAddress: vi.fn(),
    assertActive: vi.fn(),
    establish: vi.fn(),
  }),
);

vi.mock("./verify-wallet", () => ({
  verifyWalletSignature,
}));

vi.mock("@/lib/users/server", () => ({
  getUserService: vi.fn(async () => ({
    getByAddress,
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

const adminUser = {
  address: ADDRESS,
  role: "admin" as const,
  status: "active" as const,
  permissions: [],
  preferences: { declinedAuthorPage: false, onboardingCompletedAt: null },
  metadata: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("establishWalletSession", () => {
  beforeEach(() => {
    verifyWalletSignature.mockReset();
    getByAddress.mockReset();
    assertActive.mockReset();
    establish.mockReset();
  });

  it("creates a session for active admin users", async () => {
    verifyWalletSignature.mockResolvedValue(ADDRESS);
    getByAddress.mockResolvedValue(adminUser);
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
    getByAddress.mockResolvedValue({ ...adminUser, role: "reader" });
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
    getByAddress.mockResolvedValue(null);

    await expect(
      establishWalletSession({
        address: ADDRESS,
        message: "message",
        signature: "0x1234",
      }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
