import { randomUUID } from "node:crypto";
import type { WalletSessionStore } from "./wallet-session-store";

export const WALLET_SESSION_TTL_MS = 30 * 60 * 1000;

export type WalletSessionStatus = {
  active: boolean;
  expiresAt?: string;
};

export type EstablishedWalletSession = {
  sessionId: string;
  expiresAt: Date;
};

export function createWalletSessionService(store: WalletSessionStore) {
  return {
    async establish(
      address: string,
      options?: { now?: number },
    ): Promise<EstablishedWalletSession> {
      const now = options?.now ?? Date.now();
      await store.deleteByAddress(address);

      const sessionId = randomUUID();
      const expiresAt = new Date(now + WALLET_SESSION_TTL_MS);
      const timestamp = new Date(now);

      await store.create({
        sessionId,
        address,
        createdAt: timestamp,
        expiresAt,
        lastSeenAt: timestamp,
      });

      return { sessionId, expiresAt };
    },

    async resolve(
      sessionId: string,
      options?: { now?: number },
    ): Promise<string | null> {
      const now = options?.now ?? Date.now();
      const session = await store.getById(sessionId);
      if (!session || session.expiresAt.getTime() < now) {
        if (session) {
          await store.deleteById(sessionId);
        }
        return null;
      }

      await store.touch(sessionId, new Date(now));
      return session.address;
    },

    async revoke(sessionId: string): Promise<void> {
      await store.deleteById(sessionId);
    },

    async getStatus(
      sessionId: string | undefined,
      options?: { now?: number },
    ): Promise<WalletSessionStatus> {
      if (!sessionId) {
        return { active: false };
      }

      const now = options?.now ?? Date.now();
      const session = await store.getById(sessionId);
      if (!session || session.expiresAt.getTime() < now) {
        return { active: false };
      }

      return {
        active: true,
        expiresAt: session.expiresAt.toISOString(),
      };
    },
  };
}

export type WalletSessionService = ReturnType<typeof createWalletSessionService>;
