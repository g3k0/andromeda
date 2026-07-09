import { getAddress, isAddress } from "viem";

import { InvalidOwnerAddressError, InvalidWorkIdParamError } from "./errors";
import type { TokenRecord, WorkRecord } from "./types";

/** Public, JSON-safe projection of a work — never includes ciphertext or `K`. */
export type PublicWorkDto = {
  workId: string;
  author: `0x${string}`;
  metadataURI: string;
  price: string;
  maxCopies: string;
  minted: string;
  active: boolean;
  soldOut: boolean;
  /** Remaining copies as a string, or `null` for an unlimited edition. */
  remainingCopies: string | null;
};

export function toPublicWorkDto(work: WorkRecord): PublicWorkDto {
  const unlimited = work.maxCopies === 0n;
  const remaining = unlimited
    ? null
    : work.maxCopies > work.minted
      ? work.maxCopies - work.minted
      : 0n;

  return {
    workId: work.workId.toString(),
    author: work.author,
    metadataURI: work.metadataURI,
    price: work.price.toString(),
    maxCopies: work.maxCopies.toString(),
    minted: work.minted.toString(),
    active: work.active,
    soldOut: remaining !== null && remaining === 0n,
    remainingCopies: remaining === null ? null : remaining.toString(),
  };
}

/** Public projection of a minted copy — ownership is public on-chain data. */
export type PublicTokenDto = {
  tokenId: string;
  workId: string;
  owner: `0x${string}`;
  copyNumber: number | null;
  tbaAddress: `0x${string}` | null;
  envelopeCid: string | null;
  metadataURI: string | null;
};

export function toPublicTokenDto(token: TokenRecord): PublicTokenDto {
  return {
    tokenId: token.tokenId.toString(),
    workId: token.workId.toString(),
    owner: token.owner,
    copyNumber: token.copyNumber,
    tbaAddress: token.tbaAddress,
    envelopeCid: token.envelopeCid,
    metadataURI: token.metadataURI,
  };
}

/** Parses a route param into a positive work id, rejecting malformed input. */
export function parseWorkIdParam(value: string): bigint {
  if (!/^\d+$/.test(value)) {
    throw new InvalidWorkIdParamError(value);
  }

  const workId = BigInt(value);
  if (workId <= 0n) {
    throw new InvalidWorkIdParamError(value);
  }

  return workId;
}

/** Parses a route param into a checksummed owner address, rejecting bad input. */
export function parseOwnerParam(value: string): `0x${string}` {
  if (!isAddress(value)) {
    throw new InvalidOwnerAddressError(value);
  }
  return getAddress(value);
}
