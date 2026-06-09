import { beforeEach, describe, expect, it, vi } from "vitest";

const { bindWalletAction, createSignedWalletPayload } = vi.hoisted(() => ({
  bindWalletAction: vi.fn(),
  createSignedWalletPayload: vi.fn(),
}));

vi.mock("@/app/actions/bind-wallet", () => ({
  bindWalletAction,
}));

vi.mock("@/lib/auth/client-wallet-auth", () => ({
  createSignedWalletPayload,
}));

vi.mock("@/lib/users/user-snapshot-sync", () => ({
  requestUserSnapshotRefresh: vi.fn(),
}));

import {
  clearWalletBindingClient,
  ensureWalletBound,
  isWalletBound,
} from "./wallet-binding-client";

const ADDRESS = "0xAbCdEf0123456789AbCdEf0123456789AbCdEf01";
const signMessageAsync = vi.fn();

describe("wallet-binding-client", () => {
  beforeEach(() => {
    clearWalletBindingClient();
    bindWalletAction.mockReset();
    createSignedWalletPayload.mockReset();
    signMessageAsync.mockReset();
    createSignedWalletPayload.mockResolvedValue({
      address: ADDRESS,
      message: "Sign in",
      signature: "0xabc",
    });
    bindWalletAction.mockResolvedValue({ address: ADDRESS.toLowerCase() });
  });

  it("deduplicates concurrent bind requests for the same wallet", async () => {
    let resolveSign: (() => void) | undefined;
    createSignedWalletPayload.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSign = () =>
            resolve({
              address: ADDRESS,
              message: "Sign in",
              signature: "0xabc",
            });
        }),
    );

    const first = ensureWalletBound(ADDRESS, signMessageAsync);
    const second = ensureWalletBound(ADDRESS, signMessageAsync);

    resolveSign?.();
    await Promise.all([first, second]);

    expect(createSignedWalletPayload).toHaveBeenCalledTimes(1);
    expect(bindWalletAction).toHaveBeenCalledTimes(1);
    expect(isWalletBound(ADDRESS)).toBe(true);
  });
});
