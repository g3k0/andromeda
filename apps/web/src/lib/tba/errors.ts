import type { Address } from "viem";

export class TbaNotTokenOwnerError extends Error {
  constructor(
    public readonly tokenId: bigint,
    public readonly wallet: Address,
  ) {
    super(
      `Wallet ${wallet} does not own token ${tokenId.toString()} required for TBA control`,
    );
    this.name = "TbaNotTokenOwnerError";
  }
}

export class TbaRegistryConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TbaRegistryConfigError";
  }
}
