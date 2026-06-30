import "server-only";

import type { PublicClient } from "viem";

import { getContractAddress } from "@/lib/chain/contract";
import type { IndexerRepositories } from "@/lib/works/ports/work-repository";

import { handleChainLogs } from "./chain-event-handler";
import { computeBlockRanges, resolveLastProcessedBlock } from "./sync-cursor";

const DEFAULT_MAX_RANGE_SIZE = 2_000n;

export type SyncChainEventsOptions = {
  /** Maximum number of blocks fetched per `getLogs` call. */
  maxRangeSize?: bigint;
  /** Contract deployment block used to skip empty history on the first run. */
  startBlock?: bigint;
};

export type SyncChainEventsResult = {
  fromBlock: bigint | null;
  toBlock: bigint | null;
  processedRanges: number;
  processedEvents: number;
};

/**
 * Polls AndromedaWorks logs from the saved cursor up to the latest block and
 * projects them into MongoDB. Idempotent: the cursor only advances after each
 * range is applied, and the event handler tolerates re-processed logs.
 */
export async function syncChainEvents(
  client: PublicClient,
  repositories: IndexerRepositories,
  options: SyncChainEventsOptions = {},
): Promise<SyncChainEventsResult> {
  const maxRangeSize = options.maxRangeSize ?? DEFAULT_MAX_RANGE_SIZE;
  const address = getContractAddress();

  const latestBlock = await client.getBlockNumber();
  const cursor = await repositories.chainSync.getLastProcessedBlock();
  const lastProcessedBlock = resolveLastProcessedBlock(
    cursor,
    options.startBlock,
  );

  const ranges = computeBlockRanges(
    lastProcessedBlock,
    latestBlock,
    maxRangeSize,
  );
  if (ranges.length === 0) {
    return {
      fromBlock: null,
      toBlock: null,
      processedRanges: 0,
      processedEvents: 0,
    };
  }

  let processedEvents = 0;
  for (const range of ranges) {
    const logs = await client.getLogs({
      address,
      fromBlock: range.fromBlock,
      toBlock: range.toBlock,
    });
    const result = await handleChainLogs(repositories, logs);
    processedEvents += result.processed;
    await repositories.chainSync.setLastProcessedBlock(range.toBlock);
  }

  return {
    fromBlock: ranges[0].fromBlock,
    toBlock: ranges[ranges.length - 1].toBlock,
    processedRanges: ranges.length,
    processedEvents,
  };
}
