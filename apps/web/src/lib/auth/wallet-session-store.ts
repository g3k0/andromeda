export type WalletSessionRecord = {
  sessionId: string;
  address: string;
  createdAt: Date;
  expiresAt: Date;
  lastSeenAt: Date;
};

export type WalletSessionStore = {
  create(session: WalletSessionRecord): Promise<void>;
  getById(sessionId: string): Promise<WalletSessionRecord | null>;
  deleteById(sessionId: string): Promise<void>;
  deleteByAddress(address: string): Promise<void>;
  touch(sessionId: string, lastSeenAt: Date): Promise<void>;
};
