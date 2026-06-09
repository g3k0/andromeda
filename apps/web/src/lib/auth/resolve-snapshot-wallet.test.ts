import { beforeEach, describe, expect, it, vi } from "vitest";

const resolve = vi.fn();

vi.mock("./wallet-session-server", () => ({
  getWalletSessionService: vi.fn(async () => ({
    resolve,
  })),
}));

import { resolveAuthorizedSnapshotWallet } from "./resolve-snapshot-wallet";
import {
  WALLET_BINDING_COOKIE_NAME,
} from "./wallet-binding-cookie";
import { WALLET_SESSION_COOKIE_NAME } from "./wallet-session-cookies";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";
const OTHER = "0x1111111111111111111111111111111111111111";

describe("resolveAuthorizedSnapshotWallet", () => {
  beforeEach(() => {
    resolve.mockReset();
  });

  it("returns null when the wallet is not bound or session-matched", async () => {
    await expect(
      resolveAuthorizedSnapshotWallet(ADDRESS, null),
    ).resolves.toBeNull();
  });

  it("accepts wallets that match the binding cookie", async () => {
    const cookie = `${WALLET_BINDING_COOKIE_NAME}=${ADDRESS}`;
    await expect(
      resolveAuthorizedSnapshotWallet(ADDRESS, cookie),
    ).resolves.toBe(ADDRESS);
  });

  it("accepts wallets that match an active session", async () => {
    resolve.mockResolvedValue({
      address: ADDRESS,
      roleSlug: "admin",
      status: "active",
      permissions: ["admin:access"],
    });
    const cookie = `${WALLET_SESSION_COOKIE_NAME}=session-1`;

    await expect(
      resolveAuthorizedSnapshotWallet(ADDRESS, cookie),
    ).resolves.toBe(ADDRESS);
  });

  it("rejects wallets that match neither session nor binding cookie", async () => {
    resolve.mockResolvedValue({
      address: ADDRESS,
      roleSlug: "admin",
      status: "active",
      permissions: ["admin:access"],
    });
    const cookie = [
      `${WALLET_SESSION_COOKIE_NAME}=session-1`,
      `${WALLET_BINDING_COOKIE_NAME}=${ADDRESS}`,
    ].join("; ");

    await expect(
      resolveAuthorizedSnapshotWallet(ADDRESS, cookie),
    ).resolves.toBe(ADDRESS);
    await expect(
      resolveAuthorizedSnapshotWallet(OTHER, cookie),
    ).resolves.toBeNull();
  });
});
