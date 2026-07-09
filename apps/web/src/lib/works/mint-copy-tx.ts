import { formatEther, type Abi } from "viem";

import type { WorkOnChain } from "@/lib/chain/types";

export type WorkAvailability = {
  /** Remaining copies, or `null` when `maxCopies` is unlimited (`0`). */
  remaining: bigint | null;
  soldOut: boolean;
  /** True when the work is active and at least one copy can still be minted. */
  saleOpen: boolean;
};

export function getWorkAvailability(work: WorkOnChain): WorkAvailability {
  if (work.maxCopies === 0n) {
    return { remaining: null, soldOut: false, saleOpen: work.active };
  }

  const remainingRaw = work.maxCopies - work.minted;
  const remaining = remainingRaw > 0n ? remainingRaw : 0n;
  const soldOut = remaining === 0n;

  return { remaining, soldOut, saleOpen: work.active && !soldOut };
}

/** Native currency symbol for the target Polygon chain. */
export const MINT_PRICE_CURRENCY = "POL" as const;

export function formatWorkPrice(priceWei: bigint): string {
  return `${formatEther(priceWei)} ${MINT_PRICE_CURRENCY}`;
}

export type MintCopyTxRequest = {
  abi: Abi;
  address: `0x${string}`;
  functionName: "mintCopy";
  args: readonly [bigint];
  value: bigint;
};

export type BuildMintCopyRequestInput = {
  workId: bigint;
  priceWei: bigint;
  contractAddress: `0x${string}`;
  abi: Abi;
};

export function buildMintCopyRequest(
  input: BuildMintCopyRequestInput,
): MintCopyTxRequest {
  return {
    abi: input.abi,
    address: input.contractAddress,
    functionName: "mintCopy",
    args: [input.workId],
    value: input.priceWei,
  };
}

export type SetCopyMetadataTxRequest = {
  abi: Abi;
  address: `0x${string}`;
  functionName: "setCopyMetadataURI";
  args: readonly [bigint, string];
};

export type BuildSetCopyMetadataRequestInput = {
  tokenId: bigint;
  /** IPFS URI of the token's numbered metadata document. */
  metadataUri: string;
  contractAddress: `0x${string}`;
  abi: Abi;
};

/** Builds the write request to point a copy's on-chain `tokenURI` at its metadata. */
export function buildSetCopyMetadataRequest(
  input: BuildSetCopyMetadataRequestInput,
): SetCopyMetadataTxRequest {
  return {
    abi: input.abi,
    address: input.contractAddress,
    functionName: "setCopyMetadataURI",
    args: [input.tokenId, input.metadataUri],
  };
}
