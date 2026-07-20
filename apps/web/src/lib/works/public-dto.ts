import { getAddress, isAddress } from "viem";

import { InvalidOwnerAddressError, InvalidWorkIdParamError } from "./errors";
import type { TokenRecord, WorkRecord, WorkUploadRecord } from "./types";

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
  const remaining = unlimited ? null : work.primarySaleRemaining;

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

/** Public projection of an author work upload (no ciphertext or content keys). */
export type PublicWorkUploadDto = {
  id: string;
  author: `0x${string}`;
  name: string;
  metadataURI: string;
  metadataCid: string;
  contentCid: string;
  coverCid: string;
  externalUrl: string | null;
  workImprint: WorkUploadRecord["workImprint"];
  status: WorkUploadRecord["status"];
  workId: string | null;
  registeredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export function toPublicWorkUploadDto(
  upload: WorkUploadRecord,
): PublicWorkUploadDto {
  return {
    id: upload.id,
    author: upload.author,
    name: upload.name,
    metadataURI: upload.metadataURI,
    metadataCid: upload.metadataCid,
    contentCid: upload.contentCid,
    coverCid: upload.coverCid,
    externalUrl: upload.externalUrl,
    workImprint: upload.workImprint,
    status: upload.status,
    workId: upload.workId,
    registeredAt: upload.registeredAt,
    createdAt: upload.createdAt,
    updatedAt: upload.updatedAt,
  };
}
