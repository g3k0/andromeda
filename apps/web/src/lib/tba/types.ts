import type { Address, Hex } from "viem";

export type TbaLookupParams = {
  chainId: bigint | number;
  tokenContract: Address;
  tokenId: bigint;
  salt?: Hex;
};

export type TbaDeployTransaction = {
  to: Address;
  data: Hex;
  value: bigint;
};

export type TbaAccountRef = {
  address: Address;
  tokenContract: Address;
  tokenId: bigint;
  chainId: bigint;
};
