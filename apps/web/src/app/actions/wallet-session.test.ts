import { beforeEach, describe, expect, it, vi } from "vitest";

const { establishWalletSession, cookiesSet } = vi.hoisted(() => ({
  establishWalletSession: vi.fn(),
  cookiesSet: vi.fn(),
}));

vi.mock("@/lib/auth/establish-wallet-session", () => ({
  establishWalletSession,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: cookiesSet,
  })),
}));

vi.mock("@/lib/auth/wallet-session-server", () => ({
  getWalletSessionService: vi.fn(),
}));

import { establishWalletSessionAction } from "./wallet-session";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";
const expiresAt = new Date("2026-06-11T12:00:00.000Z");

const signedPayload = {
  address: ADDRESS,
  message: "Andromeda wants you to sign in",
  signature: "0x1234" as `0x${string}`,
};

describe("establishWalletSessionAction", () => {
  beforeEach(() => {
    establishWalletSession.mockReset();
    cookiesSet.mockReset();
    establishWalletSession.mockResolvedValue({
      sessionId: "session-1",
      expiresAt,
    });
  });

  it("verifies the wallet signature only inside establishWalletSession", async () => {
    const status = await establishWalletSessionAction(signedPayload);

    expect(establishWalletSession).toHaveBeenCalledOnce();
    expect(establishWalletSession).toHaveBeenCalledWith(signedPayload);
    expect(status).toEqual({
      active: true,
      expiresAt: expiresAt.toISOString(),
    });
    expect(cookiesSet).toHaveBeenCalledOnce();
  });
});
