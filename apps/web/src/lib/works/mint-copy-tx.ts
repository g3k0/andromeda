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

  const remaining = work.primarySaleRemaining;
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
  /** Content URI of the token's numbered metadata document. */
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

export type SetCopyEnvelopeTxRequest = {
  abi: Abi;
  address: `0x${string}`;
  functionName: "setCopyEnvelopeURI";
  args: readonly [bigint, string];
};

export type BuildSetCopyEnvelopeRequestInput = {
  tokenId: bigint;
  /** Content URI of the ACE envelope (`ar://…` or legacy `ipfs://…`). */
  envelopeUri: string;
  contractAddress: `0x${string}`;
  abi: Abi;
};

/** Builds the write request to record a copy's ACE envelope URI on-chain. */
export function buildSetCopyEnvelopeRequest(
  input: BuildSetCopyEnvelopeRequestInput,
): SetCopyEnvelopeTxRequest {
  return {
    abi: input.abi,
    address: input.contractAddress,
    functionName: "setCopyEnvelopeURI",
    args: [input.tokenId, input.envelopeUri],
  };
}

export type UpdateWorkMetadataTxRequest = {
  abi: Abi;
  address: `0x${string}`;
  functionName: "updateWorkMetadataURI";
  args: readonly [bigint, string];
};

export type BuildUpdateWorkMetadataRequestInput = {
  workId: bigint;
  metadataUri: string;
  contractAddress: `0x${string}`;
  abi: Abi;
};

/** Builds the author-only write to repoint work-level ACE metadata (IPFS → Arweave). */
export function buildUpdateWorkMetadataRequest(
  input: BuildUpdateWorkMetadataRequestInput,
): UpdateWorkMetadataTxRequest {
  return {
    abi: input.abi,
    address: input.contractAddress,
    functionName: "updateWorkMetadataURI",
    args: [input.workId, input.metadataUri],
  };
}
