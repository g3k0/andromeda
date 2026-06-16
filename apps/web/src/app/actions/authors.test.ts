import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  enforceActionRateLimit,
  runSetWalletPreferencesMutation,
  getUserService,
  getAuthorService,
} = vi.hoisted(() => ({
  enforceActionRateLimit: vi.fn(),
  runSetWalletPreferencesMutation: vi.fn(),
  getUserService: vi.fn(),
  getAuthorService: vi.fn(),
}));

vi.mock("@/lib/auth/action-rate-limit", () => ({
  enforceActionRateLimit,
}));

vi.mock("@/lib/authors/author-mutations", () => ({
  runSetWalletPreferencesMutation,
}));

vi.mock("@/lib/users/server", () => ({
  getUserService,
}));

vi.mock("@/lib/authors/server", () => ({
  getAuthorService,
}));

import { setWalletPreferencesAction } from "./authors";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

const SIGNED_BODY = {
  address: ADDRESS,
  message: "Andromeda wants you to sign in with your wallet.\n\nAddress: 0xabc\nNonce: n\nExpires: 2099-01-01T00:00:00.000Z",
  signature: "0x00" as const,
  declinedAuthorPage: true,
};

const SNAPSHOT = {
  normalizedAddress: ADDRESS,
  isConnected: true,
  roleSlug: "reader",
  roleName: "Reader",
  status: "active" as const,
  permissions: ["pages:read"] as const,
  hasAuthorProfile: false,
  declinedAuthorPage: true,
};

describe("setWalletPreferencesAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enforceActionRateLimit.mockResolvedValue(undefined);
    runSetWalletPreferencesMutation.mockResolvedValue({
      declinedAuthorPage: true,
    });
    getUserService.mockResolvedValue({
      getSnapshot: vi.fn(async () => SNAPSHOT),
    });
    getAuthorService.mockResolvedValue({
      hasAuthorProfile: vi.fn(async () => false),
    });
  });

  it("verifies the wallet signature only in the mutation layer", async () => {
    const result = await setWalletPreferencesAction(SIGNED_BODY);

    expect(enforceActionRateLimit).toHaveBeenCalledWith(
      `wallet-preferences:${ADDRESS}`,
    );
    expect(runSetWalletPreferencesMutation).toHaveBeenCalledWith(
      ADDRESS,
      SIGNED_BODY,
    );
    expect(result).toEqual({
      preferences: { declinedAuthorPage: true },
      snapshot: SNAPSHOT,
    });
  });
});
