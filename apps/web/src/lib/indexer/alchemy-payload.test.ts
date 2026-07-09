import { encodeAbiParameters, encodeEventTopics } from "viem";
import { describe, expect, it } from "vitest";

import { andromedaWorksAbi } from "@/lib/chain/contract";
import { createInMemoryIndexerRepositories } from "@/lib/works/testing/in-memory-indexer-repositories";

import { extractLogsFromAlchemyPayload } from "./alchemy-payload";
import { handleChainLogs } from "./chain-event-handler";

const CONTRACT = "0x1111111111111111111111111111111111111111";
const AUTHOR = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as const;

function workRegisteredLog(workId: bigint) {
  return {
    account: { address: CONTRACT },
    topics: encodeEventTopics({
      abi: andromedaWorksAbi,
      eventName: "WorkRegistered",
      args: { workId, author: AUTHOR },
    }),
    data: encodeAbiParameters(
      [{ type: "string" }, { type: "uint256" }, { type: "uint256" }],
      ["ipfs://meta", 1000n, 10n],
    ),
    index: 2,
    transaction: { hash: "0x" + "ab".repeat(32), index: 0 },
  };
}

function payload(logs: unknown[]) {
  return {
    webhookId: "wh_test",
    event: { data: { block: { number: 42, hash: "0x" + "cd".repeat(32), logs } } },
  };
}

describe("extractLogsFromAlchemyPayload", () => {
  it("maps Notify logs to viem logs", () => {
    const logs = extractLogsFromAlchemyPayload(payload([workRegisteredLog(1n)]));
    expect(logs).toHaveLength(1);
    expect(logs[0].address).toBe(CONTRACT);
    expect(logs[0].blockNumber).toBe(42n);
    expect(logs[0].logIndex).toBe(2);
    expect(logs[0].topics[0]).toMatch(/^0x/);
  });

  it("returns an empty array for a malformed payload", () => {
    expect(extractLogsFromAlchemyPayload({ nope: true })).toEqual([]);
    expect(extractLogsFromAlchemyPayload(null)).toEqual([]);
  });

  it("feeds decoded events into the chain handler", async () => {
    const repos = createInMemoryIndexerRepositories();
    const logs = extractLogsFromAlchemyPayload(payload([workRegisteredLog(5n)]));

    const result = await handleChainLogs(repos, logs);
    expect(result.processed).toBe(1);

    const work = await repos.works.getWork(5n);
    expect(work?.metadataURI).toBe("ipfs://meta");
    expect(work?.price).toBe(1000n);
  });
});
