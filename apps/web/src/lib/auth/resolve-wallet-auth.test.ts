import { beforeEach, describe, expect, it, vi } from "vitest";
import { WalletAuthorizationError } from "./errors";
import { UserNotFoundError, UserSuspendedError } from "@/lib/users/errors";
import { buildAuthenticatedUser } from "@/lib/users/testing/build-authenticated-user";
import { createInMemoryWalletSessionStore } from "./testing/in-memory-wallet-session-store";
import { createWalletSessionService } from "./wallet-session";

const { verifyWalletSignature, getAuthenticatedByAddress, assertActive } =
  vi.hoisted(() => ({
    verifyWalletSignature: vi.fn(),
    getAuthenticatedByAddress: vi.fn(),
    assertActive: vi.fn(),
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
  getWalletSessionService: vi.fn(),
}));

import { getWalletSessionService } from "./wallet-session-server";
import { resolveWalletAuth } from "./resolve-wallet-auth";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";
const SESSION_ID = "session-123";
const adminUser = buildAuthenticatedUser(ADDRESS, "admin");

describe("resolveWalletAuth", () => {
  beforeEach(() => {
    verifyWalletSignature.mockReset();
    getAuthenticatedByAddress.mockReset();
    assertActive.mockReset();
    vi.mocked(getWalletSessionService).mockResolvedValue(
      createWalletSessionService(createInMemoryWalletSessionStore()),
    );
  });

  it("resolves an active wallet session", async () => {
    const service = createWalletSessionService(createInMemoryWalletSessionStore());
    const { sessionId } = await service.establish(ADDRESS);
    vi.mocked(getWalletSessionService).mockResolvedValue(service);
    getAuthenticatedByAddress.mockResolvedValue(adminUser);
    assertActive.mockImplementation(() => undefined);

    await expect(resolveWalletAuth({ sessionId })).resolves.toEqual(adminUser);
  });

  it("falls back to wallet signature when session is missing", async () => {
    verifyWalletSignature.mockResolvedValue(ADDRESS);
    getAuthenticatedByAddress.mockResolvedValue(adminUser);
    assertActive.mockImplementation(() => undefined);

    await expect(
      resolveWalletAuth({
        walletAuth: {
          address: ADDRESS,
          message: "message",
          signature: "0x1234",
        },
      }),
    ).resolves.toEqual(adminUser);
  });

  it("rejects requests without session or signature", async () => {
    await expect(resolveWalletAuth({})).rejects.toBeInstanceOf(
      WalletAuthorizationError,
    );
  });

  it("revokes suspended session users", async () => {
    const store = createInMemoryWalletSessionStore();
    const service = createWalletSessionService(store);
    const { sessionId } = await service.establish(ADDRESS);
    vi.mocked(getWalletSessionService).mockResolvedValue(service);
    getAuthenticatedByAddress.mockResolvedValue({
      ...adminUser,
      status: "suspended",
    });
    assertActive.mockImplementation(() => {
      throw new UserSuspendedError(ADDRESS);
    });

    await expect(resolveWalletAuth({ sessionId })).rejects.toBeInstanceOf(
      UserSuspendedError,
    );
    await expect(service.resolve(sessionId)).resolves.toBeNull();
  });

  it("rejects unknown session users", async () => {
    const service = createWalletSessionService(createInMemoryWalletSessionStore());
    const { sessionId } = await service.establish(ADDRESS);
    vi.mocked(getWalletSessionService).mockResolvedValue(service);
    getAuthenticatedByAddress.mockResolvedValue(null);

    await expect(resolveWalletAuth({ sessionId })).rejects.toBeInstanceOf(
      UserNotFoundError,
    );
    await expect(service.resolve(sessionId)).resolves.toBeNull();
  });

  it("rejects invalid sessions without a signature fallback", async () => {
    const service = createWalletSessionService(createInMemoryWalletSessionStore());
    vi.mocked(getWalletSessionService).mockResolvedValue(service);

    await expect(
      resolveWalletAuth({ sessionId: SESSION_ID }),
    ).rejects.toBeInstanceOf(WalletAuthorizationError);
  });
});
