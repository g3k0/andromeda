import { getAddress } from "viem";

import { InvalidWorkIdError } from "./errors";
import type { RawWorkTuple, TokenOwner, WorkOnChain } from "./types";

export function normalizeAddress(address: string): `0x${string}` {
  return getAddress(address);
}

export function assertValidWorkId(workId: bigint, totalWorks: bigint): void {
  if (workId <= 0n || workId > totalWorks) {
    throw new InvalidWorkIdError(workId, totalWorks);
  }
}

export function mapRawWorkToWorkOnChain(
  workId: bigint,
  raw: RawWorkTuple,
  primarySaleRemaining: bigint,
): WorkOnChain {
  const [author, metadataURI, price, maxCopies, minted, active] = raw;

  return {
    workId,
    author: normalizeAddress(author),
    metadataURI,
    price,
    maxCopies,
    minted,
    primarySaleRemaining,
    active,
  };
}

export function mapOwnerOf(tokenId: bigint, owner: string): TokenOwner {
  return {
    tokenId,
    owner: normalizeAddress(owner),
  };
}
