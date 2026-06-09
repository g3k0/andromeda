import type { WalletAuthNonceRecord, WalletAuthNonceStore } from "../wallet-auth-nonce-store";

export class InMemoryWalletAuthNonceStore implements WalletAuthNonceStore {
  private readonly records = new Map<string, WalletAuthNonceRecord>();

  async put(record: WalletAuthNonceRecord): Promise<void> {
    this.records.set(record.nonce, { ...record });
  }

  async consumeIfValid(
    nonce: string,
    address: string,
    now: Date,
  ): Promise<boolean> {
    const record = this.records.get(nonce);
    if (
      !record ||
      record.used ||
      record.address !== address ||
      record.expiresAt.getTime() < now.getTime()
    ) {
      return false;
    }

    record.used = true;
    return true;
  }

  async clear(): Promise<void> {
    this.records.clear();
  }
}
