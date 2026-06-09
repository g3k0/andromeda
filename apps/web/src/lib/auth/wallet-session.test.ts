import { describe, expect, it } from "vitest";
import { createWalletSessionService, WALLET_SESSION_TTL_MS } from "./wallet-session";
import { createInMemoryWalletSessionStore } from "./testing/in-memory-wallet-session-store";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

describe("wallet session service", () => {
  it("establishes and resolves a session", async () => {
    const service = createWalletSessionService(createInMemoryWalletSessionStore());
    const now = Date.now();
    const { sessionId } = await service.establish(ADDRESS, { now });

    await expect(service.resolve(sessionId, { now: now + 1_000 })).resolves.toBe(
      ADDRESS,
    );
    await expect(service.getStatus(sessionId, { now: now + 1_000 })).resolves.toEqual({
      active: true,
      expiresAt: new Date(now + WALLET_SESSION_TTL_MS).toISOString(),
    });
  });

  it("revokes expired sessions on resolve", async () => {
    const service = createWalletSessionService(createInMemoryWalletSessionStore());
    const now = Date.now();
    const { sessionId } = await service.establish(ADDRESS, { now });

    await expect(
      service.resolve(sessionId, { now: now + WALLET_SESSION_TTL_MS + 1 }),
    ).resolves.toBeNull();
    await expect(
      service.getStatus(sessionId, { now: now + WALLET_SESSION_TTL_MS + 1 }),
    ).resolves.toEqual({ active: false });
  });

  it("replaces existing sessions for the same address", async () => {
    const store = createInMemoryWalletSessionStore();
    const service = createWalletSessionService(store);
    const first = await service.establish(ADDRESS);
    const second = await service.establish(ADDRESS);

    expect(first.sessionId).not.toBe(second.sessionId);
    await expect(service.resolve(first.sessionId)).resolves.toBeNull();
    await expect(service.resolve(second.sessionId)).resolves.toBe(ADDRESS);
  });
});
