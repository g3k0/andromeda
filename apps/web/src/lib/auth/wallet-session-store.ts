import type { UserPermission, UserStatus } from "@/lib/users/types";

export type WalletSessionRecord = {
  sessionId: string;
  address: string;
  roleSlug: string;
  status: UserStatus;
  permissions: UserPermission[];
  createdAt: Date;
  expiresAt: Date;
  lastSeenAt: Date;
};

export type WalletSessionSnapshot = {
  address: string;
  roleSlug: string;
  status: UserStatus;
  permissions: UserPermission[];
};

export type EstablishWalletSessionInput = {
  address: string;
  roleSlug: string;
  status: UserStatus;
  permissions: UserPermission[];
};

export type WalletSessionStore = {
  create(session: WalletSessionRecord): Promise<void>;
  getById(sessionId: string): Promise<WalletSessionRecord | null>;
  deleteById(sessionId: string): Promise<void>;
  deleteByAddress(address: string): Promise<void>;
  deleteByRoleSlug(roleSlug: string): Promise<void>;
  touch(sessionId: string, lastSeenAt: Date): Promise<void>;
  refreshSnapshot(
    sessionId: string,
    snapshot: WalletSessionSnapshot,
  ): Promise<void>;
};
