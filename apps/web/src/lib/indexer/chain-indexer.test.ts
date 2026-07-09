import {
  encodeAbiParameters,
  encodeEventTopics,
  type Log,
  type PublicClient,
} from "viem";
import { describe, expect, it, vi } from "vitest";

import { andromedaWorksAbi } from "@/lib/chain/contract";
import { createInMemoryIndexerRepositories } from "@/lib/works/testing/in-memory-indexer-repositories";

import { syncChainEvents } from "./chain-indexer";

const AUTHOR = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as const;

function workRegisteredLog(workId: bigint, blockNumber: bigint): Log {
  return {
    address: "0x1111111111111111111111111111111111111111",
    topics: encodeEventTopics({
      abi: andromedaWorksAbi,
      eventName: "WorkRegistered",
      args: { workId, author: AUTHOR },
    }) as [`0x${string}`, ...`0x${string}`[]],
    data: encodeAbiParameters(
      [{ type: "string" }, { type: "uint256" }, { type: "uint256" }],
      ["ipfs://m", 10n, 100n],
    ),
    blockHash:
      "0x0000000000000000000000000000000000000000000000000000000000000001",
    blockNumber,
    logIndex: 0,
    transactionHash:
      "0x0000000000000000000000000000000000000000000000000000000000000002",
    transactionIndex: 0,
    removed: false,
  };
}

function fakeClient(latestBlock: bigint, logs: Log[]) {
  const getLogs = vi.fn(async () => logs);
  const getBlockNumber = vi.fn(async () => latestBlock);
  return {
    client: { getLogs, getBlockNumber } as unknown as PublicClient,
    getLogs,
  };
}

describe("syncChainEvents", () => {
  it("projects events and advances the cursor", async () => {
    const repos = createInMemoryIndexerRepositories();
    const { client } = fakeClient(5n, [workRegisteredLog(3n, 3n)]);

    const result = await syncChainEvents(client, repos, { maxRangeSize: 100n });

    expect(result.processedEvents).toBe(1);
    expect(result.fromBlock).toBe(1n);
    expect(result.toBlock).toBe(5n);
    expect(await repos.chainSync.getLastProcessedBlock()).toBe(5n);
    expect(await repos.works.getWork(3n)).not.toBeNull();
  });

  it("does nothing when there are no new blocks", async () => {
    const repos = createInMemoryIndexerRepositories();
    await repos.chainSync.setLastProcessedBlock(10n);
    const { client, getLogs } = fakeClient(10n, []);

    const result = await syncChainEvents(client, repos);

    expect(result.processedRanges).toBe(0);
    expect(getLogs).not.toHaveBeenCalled();
    expect(await repos.chainSync.getLastProcessedBlock()).toBe(10n);
  });

  it("honors the start block on the first run", async () => {
    const repos = createInMemoryIndexerRepositories();
    const { client, getLogs } = fakeClient(105n, []);

    const result = await syncChainEvents(client, repos, {
      startBlock: 100n,
      maxRangeSize: 100n,
    });

    expect(result.fromBlock).toBe(100n);
    expect(getLogs).toHaveBeenCalledWith(
      expect.objectContaining({ fromBlock: 100n, toBlock: 105n }),
    );
  });

  it("logs and rethrows on getLogs failure, leaving the cursor untouched", async () => {
    const repos = createInMemoryIndexerRepositories();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const getBlockNumber = vi.fn(async () => 5n);
    const getLogs = vi.fn(async () => {
      throw new Error("RPC 429 rate limited");
    });
    const client = { getLogs, getBlockNumber } as unknown as PublicClient;

    await expect(
      syncChainEvents(client, repos, { maxRangeSize: 100n }),
    ).rejects.toThrow(/rate limited/);

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(errorSpy.mock.calls[0][0] as string);
    expect(parsed).toMatchObject({
      scope: "chain.indexer",
      event: "get_logs_failed",
    });
    expect(await repos.chainSync.getLastProcessedBlock()).toBe(0n);

    errorSpy.mockRestore();
  });

  it("splits work across multiple ranges and advances the cursor each time", async () => {
    const repos = createInMemoryIndexerRepositories();
    const { client, getLogs } = fakeClient(25n, []);

    const result = await syncChainEvents(client, repos, { maxRangeSize: 10n });

    expect(result.processedRanges).toBe(3);
    expect(getLogs).toHaveBeenCalledTimes(3);
    expect(await repos.chainSync.getLastProcessedBlock()).toBe(25n);
  });
});
