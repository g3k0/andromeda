import type {
  WalletSessionRecord,
  WalletSessionStore,
} from "../wallet-session-store";

export function createInMemoryWalletSessionStore(): WalletSessionStore {
  const sessions = new Map<string, WalletSessionRecord>();

  return {
    async create(session) {
      sessions.set(session.sessionId, { ...session });
    },

    async getById(sessionId) {
      return sessions.get(sessionId) ?? null;
    },

    async deleteById(sessionId) {
      sessions.delete(sessionId);
    },

    async deleteByAddress(address) {
      for (const [sessionId, session] of sessions.entries()) {
        if (session.address === address) {
          sessions.delete(sessionId);
        }
      }
    },

    async deleteByRoleSlug(roleSlug) {
      for (const [sessionId, session] of sessions.entries()) {
        if (session.roleSlug === roleSlug) {
          sessions.delete(sessionId);
        }
      }
    },

    async touch(sessionId, lastSeenAt) {
      const session = sessions.get(sessionId);
      if (!session) {
        return;
      }
      sessions.set(sessionId, { ...session, lastSeenAt });
    },
  };
}
