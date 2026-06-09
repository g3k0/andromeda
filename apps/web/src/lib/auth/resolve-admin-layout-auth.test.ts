import { beforeEach, describe, expect, it, vi } from "vitest";
import { WalletAuthorizationError } from "./errors";
import {
  WALLET_BINDING_COOKIE_NAME,
} from "./wallet-binding-cookie";
import { WALLET_SESSION_COOKIE_NAME } from "./wallet-session-cookies";

const { resolveWalletAuth, getUserService, assertCanAccessAdmin } = vi.hoisted(
  () => ({
    resolveWalletAuth: vi.fn(),
    getUserService: vi.fn(),
    assertCanAccessAdmin: vi.fn(),
  }),
);

vi.mock("./resolve-wallet-auth", () => ({
  resolveWalletAuth,
}));

vi.mock("@/lib/users/server", () => ({
  getUserService,
}));

vi.mock("@/lib/users/authorize", async () => {
  const actual = await vi.importActual<typeof import("@/lib/users/authorize")>(
    "@/lib/users/authorize",
  );
  return {
    ...actual,
    assertCanAccessAdmin,
  };
});

import { resolveAdminLayoutAuth } from "./resolve-admin-layout-auth";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";
const SESSION_ID = "session-123";

const adminUser = {
  address: ADDRESS,
  roleSlug: "admin",
  status: "active",
  permissions: ["admin:access", "users:read"],
  role: { slug: "admin", name: "Admin", permissions: ["admin:access"] },
  permissionOverrides: [],
  preferences: { declinedAuthorPage: false, onboardingCompletedAt: null },
  metadata: {},
};

describe("resolveAdminLayoutAuth", () => {
  beforeEach(() => {
    resolveWalletAuth.mockReset();
    getUserService.mockReset();
    assertCanAccessAdmin.mockReset();
    assertCanAccessAdmin.mockImplementation(() => undefined);
  });

  it("authorizes admins through an active wallet session", async () => {
    resolveWalletAuth.mockResolvedValue(adminUser);

    const cookie = `${WALLET_SESSION_COOKIE_NAME}=${SESSION_ID}`;
    const user = await resolveAdminLayoutAuth(cookie);

    expect(resolveWalletAuth).toHaveBeenCalledWith({
      sessionId: SESSION_ID,
      walletAuth: null,
      cookieHeader: cookie,
    });
    expect(assertCanAccessAdmin).toHaveBeenCalledWith(adminUser);
    expect(user).toEqual(adminUser);
  });

  it("falls back to wallet binding when the session is unavailable", async () => {
    resolveWalletAuth.mockRejectedValue(new WalletAuthorizationError());
    getUserService.mockResolvedValue({
      getAuthenticatedByAddress: vi.fn().mockResolvedValue(adminUser),
      assertActive: vi.fn(),
    });

    const cookie = `${WALLET_BINDING_COOKIE_NAME}=${ADDRESS}`;
    const user = await resolveAdminLayoutAuth(cookie);

    expect(user).toEqual(adminUser);
    expect(assertCanAccessAdmin).toHaveBeenCalledWith(adminUser);
  });

  it("rejects requests without session or binding cookies", async () => {
    await expect(resolveAdminLayoutAuth(null)).rejects.toBeInstanceOf(
      WalletAuthorizationError,
    );
  });
});
