import { WalletAuthNonceModel } from "@/lib/db/models/wallet-auth-nonce.model";
import type {
  WalletAuthNonceRecord,
  WalletAuthNonceStore,
} from "../wallet-auth-nonce-store";

export class MongoWalletAuthNonceStore implements WalletAuthNonceStore {
  async put(record: WalletAuthNonceRecord): Promise<void> {
    await WalletAuthNonceModel.create({
      nonce: record.nonce,
      address: record.address,
      expiresAt: record.expiresAt,
      used: record.used,
    });
  }

  async consumeIfValid(
    nonce: string,
    address: string,
    now: Date,
  ): Promise<boolean> {
    const updated = await WalletAuthNonceModel.findOneAndUpdate(
      {
        nonce,
        address,
        used: false,
        expiresAt: { $gt: now },
      },
      { $set: { used: true } },
      { new: true },
    ).lean();

    return Boolean(updated);
  }

  async clear(): Promise<void> {
    await WalletAuthNonceModel.deleteMany({});
  }
}
