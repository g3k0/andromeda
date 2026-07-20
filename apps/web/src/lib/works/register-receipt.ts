import { parseEventLogs, type Log } from "viem";

import { andromedaWorksAbi } from "@/lib/chain/contract";

import { WorkMintError } from "./errors";

export type WorkRegisteredEvent = {
  workId: bigint;
  author: `0x${string}`;
  metadataURI: string;
  price: bigint;
  maxCopies: bigint;
};

export type CopyMintedEvent = {
  workId: bigint;
  tokenId: bigint;
  recipient: `0x${string}`;
  copyNumber: bigint;
};

type WorkRegisteredArgs = {
  workId: bigint;
  author: `0x${string}`;
  metadataURI: string;
  price: bigint;
  maxCopies: bigint;
};

type CopyMintedArgs = {
  workId: bigint;
  tokenId: bigint;
  recipient: `0x${string}`;
  copyNumber: bigint;
};

export function parseWorkRegisteredEvents(
  logs: readonly Log[],
): WorkRegisteredEvent[] {
  const parsed = parseEventLogs({
    abi: andromedaWorksAbi,
    eventName: "WorkRegistered",
    logs: [...logs],
  });

  return parsed.map((log) => {
    const args = log.args as WorkRegisteredArgs;
    return {
      workId: args.workId,
      author: args.author,
      metadataURI: args.metadataURI,
      price: args.price,
      maxCopies: args.maxCopies,
    };
  });
}

export function parseCopyMintedEvents(logs: readonly Log[]): CopyMintedEvent[] {
  const parsed = parseEventLogs({
    abi: andromedaWorksAbi,
    eventName: "CopyMinted",
    logs: [...logs],
  });

  return parsed.map((log) => {
    const args = log.args as CopyMintedArgs;
    return {
      workId: args.workId,
      tokenId: args.tokenId,
      recipient: args.recipient,
      copyNumber: args.copyNumber,
    };
  });
}

/** Returns the work id from the first `WorkRegistered` log in a register transaction. */
export function extractRegisteredWorkId(logs: readonly Log[]): bigint {
  const events = parseWorkRegisteredEvents(logs);
  if (events.length === 0) {
    throw new WorkMintError(
      "No WorkRegistered event found in transaction logs",
    );
  }
  return events[0].workId;
}

/** Returns minted copies ordered by ascending copy number. */
export function extractRegisteredCopies(logs: readonly Log[]): CopyMintedEvent[] {
  return [...parseCopyMintedEvents(logs)].sort((left, right) => {
    if (left.copyNumber === right.copyNumber) {
      return left.tokenId < right.tokenId ? -1 : left.tokenId > right.tokenId ? 1 : 0;
    }
    return left.copyNumber < right.copyNumber ? -1 : 1;
  });
}
