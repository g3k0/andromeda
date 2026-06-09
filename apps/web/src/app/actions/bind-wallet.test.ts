import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  verifyWalletSignature,
  findOrCreateByWallet,
  enforceActionRateLimit,
  cookieSet,
} = vi.hoisted(() => ({
  verifyWalletSignature: vi.fn(),
  findOrCreateByWallet: vi.fn(),
  enforceActionRateLimit: vi.fn(),
  cookieSet: vi.fn(),
}));

vi.mock("@/lib/auth/verify-wallet", () => ({
  verifyWalletSignature,
}));

vi.mock("@/lib/users/server", () => ({
  getUserService: vi.fn(async () => ({
    findOrCreateByWallet,
  })),
}));

vi.mock("@/lib/auth/action-rate-limit", () => ({
  enforceActionRateLimit,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: cookieSet,
    get: vi.fn(),
  })),
}));

import { bindWalletAction } from "./bind-wallet";
import { WALLET_BINDING_COOKIE_NAME } from "@/lib/auth/wallet-binding-cookie";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

describe("bindWalletAction", () => {
  beforeEach(() => {
    verifyWalletSignature.mockReset();
    findOrCreateByWallet.mockReset();
    enforceActionRateLimit.mockReset();
    cookieSet.mockReset();
    enforceActionRateLimit.mockResolvedValue(undefined);
  });

  it("verifies the signature, provisions the user, and sets the binding cookie", async () => {
    verifyWalletSignature.mockResolvedValue(ADDRESS);
    findOrCreateByWallet.mockResolvedValue({ address: ADDRESS });

    const result = await bindWalletAction({
      address: ADDRESS,
      message: "Sign in",
      signature: "0xabc",
    });

    expect(enforceActionRateLimit).toHaveBeenCalledWith(`bind-wallet:${ADDRESS}`);
    expect(findOrCreateByWallet).toHaveBeenCalledWith(ADDRESS);
    expect(cookieSet).toHaveBeenCalledWith(
      WALLET_BINDING_COOKIE_NAME,
      ADDRESS,
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      }),
    );
    expect(result).toEqual({ address: ADDRESS });
  });
});
