export type WalletAuthNonceRecord = {
  nonce: string;
  address: string;
  expiresAt: Date;
  used: boolean;
};

export type WalletAuthNonceStore = {
  put(record: WalletAuthNonceRecord): Promise<void>;
  consumeIfValid(
    nonce: string,
    address: string,
    now: Date,
  ): Promise<boolean>;
  clear(): Promise<void>;
};
