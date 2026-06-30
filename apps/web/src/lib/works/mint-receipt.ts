import { parseEventLogs, type Log } from "viem";

import { andromedaWorksAbi } from "@/lib/chain/contract";

import { WorkMintError } from "./errors";

export type CopyMintedEvent = {
  workId: bigint;
  tokenId: bigint;
  buyer: `0x${string}`;
};

type CopyMintedArgs = {
  workId: bigint;
  tokenId: bigint;
  buyer: `0x${string}`;
};

/** Decodes every `CopyMinted` event emitted in a transaction's logs. */
export function parseCopyMintedEvents(
  logs: readonly Log[],
): CopyMintedEvent[] {
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
      buyer: args.buyer,
    };
  });
}

export type ExtractMintedTokenIdOptions = {
  workId?: bigint;
  buyer?: string;
};

/**
 * Returns the `tokenId` of the freshly minted copy from a transaction receipt's
 * logs, optionally narrowing by `workId` / `buyer` when multiple copies mint.
 */
export function extractMintedTokenId(
  logs: readonly Log[],
  options: ExtractMintedTokenIdOptions = {},
): bigint {
  const events = parseCopyMintedEvents(logs);
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
      "No matching CopyMinted event found in transaction logs",
    );
  }

  return matches[0].tokenId;
}
