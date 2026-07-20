import { parseEventLogs, type Log } from "viem";

import { andromedaWorksAbi } from "@/lib/chain/contract";

import { WorkMintError } from "./errors";

export type CopyPurchasedEvent = {
  workId: bigint;
  tokenId: bigint;
  buyer: `0x${string}`;
};

type CopyPurchasedArgs = {
  workId: bigint;
  tokenId: bigint;
  buyer: `0x${string}`;
};

/** Decodes every `CopyPurchased` event emitted in a transaction's logs. */
export function parseCopyPurchasedEvents(
  logs: readonly Log[],
): CopyPurchasedEvent[] {
  const parsed = parseEventLogs({
    abi: andromedaWorksAbi,
    eventName: "CopyPurchased",
    logs: [...logs],
  });

  return parsed.map((log) => {
    const args = log.args as CopyPurchasedArgs;
    return {
      workId: args.workId,
      tokenId: args.tokenId,
      buyer: args.buyer,
    };
  });
}

export type ExtractMintedTokenIdOptions = {
  workId?: bigint;
  buyer?: string;
};

/**
 * Returns the `tokenId` of the copy purchased in a transaction receipt's logs,
 * optionally narrowing by `workId` / `buyer`.
 */
export function extractMintedTokenId(
  logs: readonly Log[],
  options: ExtractMintedTokenIdOptions = {},
): bigint {
  const events = parseCopyPurchasedEvents(logs);
  const buyer = options.buyer?.toLowerCase();

  const matches = events.filter((event) => {
    if (options.workId !== undefined && event.workId !== options.workId) {
      return false;
    }
    if (buyer !== undefined && event.buyer.toLowerCase() !== buyer) {
      return false;
    }
    return true;
  });

  if (matches.length === 0) {
    throw new WorkMintError(
      "No matching CopyPurchased event found in transaction logs",
    );
  }

  return matches[0].tokenId;
}
