import { WalletSessionModel } from "@/lib/db/models/wallet-session.model";
import { isUserPermission } from "@/lib/users/types";
import type {
  WalletSessionRecord,
  WalletSessionStore,
} from "../wallet-session-store";

export class MongoWalletSessionStore implements WalletSessionStore {
  async create(session: WalletSessionRecord): Promise<void> {
    await WalletSessionModel.create({
      sessionId: session.sessionId,
      address: session.address,
      roleSlug: session.roleSlug,
      status: session.status,
      permissions: session.permissions,
      expiresAt: session.expiresAt,
      lastSeenAt: session.lastSeenAt,
      createdAt: session.createdAt,
    });
  }

  async getById(sessionId: string): Promise<WalletSessionRecord | null> {
    const doc = await WalletSessionModel.findOne({ sessionId }).lean();
    if (!doc) {
      return null;
    }

    return {
      sessionId: doc.sessionId,
      address: doc.address,
      roleSlug: doc.roleSlug,
      status: doc.status,
      permissions: doc.permissions.filter(isUserPermission),
      createdAt: doc.createdAt,
      expiresAt: doc.expiresAt,
      lastSeenAt: doc.lastSeenAt,
    };
  }

  async deleteById(sessionId: string): Promise<void> {
    await WalletSessionModel.deleteOne({ sessionId });
  }

  async deleteByAddress(address: string): Promise<void> {
    await WalletSessionModel.deleteMany({ address });
  }

  async deleteByRoleSlug(roleSlug: string): Promise<void> {
    await WalletSessionModel.deleteMany({ roleSlug });
  }

  async touch(sessionId: string, lastSeenAt: Date): Promise<void> {
    await WalletSessionModel.updateOne({ sessionId }, { $set: { lastSeenAt } });
  }
}
