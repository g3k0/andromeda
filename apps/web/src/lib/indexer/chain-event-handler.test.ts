import {
  encodeAbiParameters,
  encodeEventTopics,
  zeroAddress,
  type Log,
} from "viem";
import { describe, expect, it } from "vitest";

import { andromedaWorksAbi } from "@/lib/chain/contract";
import { createInMemoryIndexerRepositories } from "@/lib/works/testing/in-memory-indexer-repositories";

import { decodeAndromedaEvents, handleChainLogs } from "./chain-event-handler";

const AUTHOR = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as const;
const BUYER = "0x2222222222222222222222222222222222222222" as const;
const BUYER2 = "0x3333333333333333333333333333333333333333" as const;

type LogParts = { topics: `0x${string}`[]; data: `0x${string}` };

function baseLog(parts: LogParts, logIndex: number, blockNumber = 1n): Log {
  return {
    address: "0x1111111111111111111111111111111111111111",
    topics: parts.topics as [`0x${string}`, ...`0x${string}`[]],
    data: parts.data,
    blockHash:
      "0x0000000000000000000000000000000000000000000000000000000000000001",
    blockNumber,
    logIndex,
    transactionHash:
      "0x0000000000000000000000000000000000000000000000000000000000000002",
    transactionIndex: 0,
    removed: false,
  };
}

function workRegisteredLog(
  args: { workId: bigint; metadataURI: string; price: bigint; maxCopies: bigint },
  logIndex: number,
  blockNumber?: bigint,
): Log {
  return baseLog(
    {
      topics: encodeEventTopics({
        abi: andromedaWorksAbi,
        eventName: "WorkRegistered",
        args: { workId: args.workId, author: AUTHOR },
      }) as `0x${string}`[],
      data: encodeAbiParameters(
        [{ type: "string" }, { type: "uint256" }, { type: "uint256" }],
        [args.metadataURI, args.price, args.maxCopies],
      ),
    },
    logIndex,
    blockNumber,
  );
}

function workStatusChangedLog(
  workId: bigint,
  active: boolean,
  logIndex: number,
  blockNumber?: bigint,
): Log {
  return baseLog(
    {
      topics: encodeEventTopics({
        abi: andromedaWorksAbi,
        eventName: "WorkStatusChanged",
        args: { workId },
      }) as `0x${string}`[],
      data: encodeAbiParameters([{ type: "bool" }], [active]),
    },
    logIndex,
    blockNumber,
  );
}

function copyMintedLog(
  args: {
    workId: bigint;
    tokenId: bigint;
    recipient: `0x${string}`;
    copyNumber: bigint;
  },
  logIndex: number,
  blockNumber?: bigint,
): Log {
  return baseLog(
    {
      topics: encodeEventTopics({
        abi: andromedaWorksAbi,
        eventName: "CopyMinted",
        args: {
          workId: args.workId,
          tokenId: args.tokenId,
          recipient: args.recipient,
        },
      }) as `0x${string}`[],
      data: encodeAbiParameters([{ type: "uint256" }], [args.copyNumber]),
    },
    logIndex,
    blockNumber,
  );
}

function copyPurchasedLog(
  args: { workId: bigint; tokenId: bigint; buyer: `0x${string}` },
  logIndex: number,
  blockNumber?: bigint,
): Log {
  return baseLog(
    {
      topics: encodeEventTopics({
        abi: andromedaWorksAbi,
        eventName: "CopyPurchased",
        args,
      }) as `0x${string}`[],
      data: "0x",
    },
    logIndex,
    blockNumber,
  );
}

function copyMetadataUpdatedLog(
  args: { tokenId: bigint; metadataURI: string },
  logIndex: number,
  blockNumber?: bigint,
): Log {
  return baseLog(
    {
      topics: encodeEventTopics({
        abi: andromedaWorksAbi,
        eventName: "CopyMetadataUpdated",
        args: { tokenId: args.tokenId },
      }) as `0x${string}`[],
      data: encodeAbiParameters([{ type: "string" }], [args.metadataURI]),
    },
    logIndex,
    blockNumber,
  );
}

function copyEnvelopeUpdatedLog(
  args: { tokenId: bigint; envelopeURI: string },
  logIndex: number,
  blockNumber?: bigint,
): Log {
  return baseLog(
    {
      topics: encodeEventTopics({
        abi: andromedaWorksAbi,
        eventName: "CopyEnvelopeUpdated",
        args: { tokenId: args.tokenId },
      }) as `0x${string}`[],
      data: encodeAbiParameters([{ type: "string" }], [args.envelopeURI]),
    },
    logIndex,
    blockNumber,
  );
}

function transferLog(
  args: { from: `0x${string}`; to: `0x${string}`; tokenId: bigint },
  logIndex: number,
  blockNumber?: bigint,
): Log {
  return baseLog(
    {
      topics: encodeEventTopics({
        abi: andromedaWorksAbi,
        eventName: "Transfer",
        args,
      }) as `0x${string}`[],
      data: "0x",
    },
    logIndex,
    blockNumber,
  );
}

describe("decodeAndromedaEvents", () => {
  it("decodes and orders events by block then logIndex", () => {
    const events = decodeAndromedaEvents([
      copyMintedLog(
        { workId: 1n, tokenId: 1n, recipient: BUYER, copyNumber: 1n },
        5,
        2n,
      ),
      workRegisteredLog(
        { workId: 1n, metadataURI: "ipfs://m", price: 10n, maxCopies: 100n },
        0,
        1n,
      ),
    ]);

    expect(events.map((e) => e.event.kind)).toEqual([
      "WorkRegistered",
      "CopyMinted",
    ]);
  });

  it("ignores unrelated logs", () => {
    const events = decodeAndromedaEvents([
      baseLog({ topics: ["0xdeadbeef"], data: "0x" }, 0),
    ]);
    expect(events).toEqual([]);
  });
});

describe("handleChainLogs", () => {
  it("projects a registered work", async () => {
    const repos = createInMemoryIndexerRepositories();
    await handleChainLogs(repos, [
      workRegisteredLog(
        { workId: 1n, metadataURI: "ipfs://m", price: 10n, maxCopies: 100n },
        0,
      ),
    ]);

    const work = await repos.works.getWork(1n);
    expect(work?.metadataURI).toBe("ipfs://m");
    expect(work?.price).toBe(10n);
    expect(work?.primarySaleRemaining).toBe(100n);
    expect(work?.active).toBe(true);
  });

  it("updates work active flag on WorkStatusChanged", async () => {
    const repos = createInMemoryIndexerRepositories();
    await handleChainLogs(repos, [
      workRegisteredLog(
        { workId: 1n, metadataURI: "ipfs://m", price: 10n, maxCopies: 100n },
        0,
      ),
      workStatusChangedLog(1n, false, 1),
    ]);

    expect((await repos.works.getWork(1n))?.active).toBe(false);
  });

  it("creates tokens with incremental copy numbers and bumps minted", async () => {
    const repos = createInMemoryIndexerRepositories();
    await handleChainLogs(repos, [
      workRegisteredLog(
        { workId: 1n, metadataURI: "ipfs://m", price: 10n, maxCopies: 100n },
        0,
      ),
      copyMintedLog(
        { workId: 1n, tokenId: 10n, recipient: BUYER, copyNumber: 1n },
        1,
      ),
      copyMintedLog(
        { workId: 1n, tokenId: 11n, recipient: BUYER2, copyNumber: 2n },
        2,
      ),
    ]);

    expect((await repos.tokens.getToken(10n))?.copyNumber).toBe(1);
    expect((await repos.tokens.getToken(11n))?.copyNumber).toBe(2);
    expect((await repos.works.getWork(1n))?.minted).toBe(2n);
  });

  it("is idempotent when the same CopyMinted log is reprocessed", async () => {
    const repos = createInMemoryIndexerRepositories();
    const logs = [
      workRegisteredLog(
        { workId: 1n, metadataURI: "ipfs://m", price: 10n, maxCopies: 100n },
        0,
      ),
      copyMintedLog(
        { workId: 1n, tokenId: 10n, recipient: BUYER, copyNumber: 1n },
        1,
      ),
    ];

    await handleChainLogs(repos, logs);
    await handleChainLogs(repos, logs);

    expect((await repos.works.getWork(1n))?.minted).toBe(1n);
    expect((await repos.tokens.listByOwner(BUYER)).length).toBe(1);
  });

  it("sets token metadata URI on CopyMetadataUpdated", async () => {
    const repos = createInMemoryIndexerRepositories();
    await handleChainLogs(repos, [
      workRegisteredLog(
        { workId: 1n, metadataURI: "ipfs://m", price: 10n, maxCopies: 100n },
        0,
      ),
      copyMintedLog(
        { workId: 1n, tokenId: 10n, recipient: BUYER, copyNumber: 1n },
        1,
      ),
      copyMetadataUpdatedLog({ tokenId: 10n, metadataURI: "ipfs://token-10" }, 2),
    ]);

    expect((await repos.tokens.getToken(10n))?.metadataURI).toBe(
      "ipfs://token-10",
    );
  });

  it("sets envelope URI on CopyEnvelopeUpdated", async () => {
    const repos = createInMemoryIndexerRepositories();
    await handleChainLogs(repos, [
      workRegisteredLog(
        { workId: 1n, metadataURI: "ar://work", price: 10n, maxCopies: 100n },
        0,
      ),
      copyMintedLog(
        { workId: 1n, tokenId: 10n, recipient: BUYER, copyNumber: 1n },
        1,
      ),
      copyEnvelopeUpdatedLog(
        { tokenId: 10n, envelopeURI: "ar://token-10-envelope" },
        2,
      ),
    ]);

    expect((await repos.tokens.getToken(10n))?.envelopeCid).toBe(
      "ar://token-10-envelope",
    );
  });

  it("updates owner on secondary Transfer but ignores mint Transfer", async () => {
    const repos = createInMemoryIndexerRepositories();
    await handleChainLogs(repos, [
      workRegisteredLog(
        { workId: 1n, metadataURI: "ipfs://m", price: 10n, maxCopies: 100n },
        0,
      ),
      transferLog({ from: zeroAddress, to: BUYER, tokenId: 10n }, 1),
      copyMintedLog(
        { workId: 1n, tokenId: 10n, recipient: BUYER, copyNumber: 1n },
        2,
      ),
      transferLog({ from: BUYER, to: BUYER2, tokenId: 10n }, 3, 2n),
    ]);

    const token = await repos.tokens.getToken(10n);
    expect(token?.owner.toLowerCase()).toBe(BUYER2);
  });

  it("transfers ownership and decrements inventory on CopyPurchased", async () => {
    const repos = createInMemoryIndexerRepositories();
    await handleChainLogs(repos, [
      workRegisteredLog(
        { workId: 1n, metadataURI: "ipfs://m", price: 10n, maxCopies: 100n },
        0,
      ),
      copyMintedLog(
        { workId: 1n, tokenId: 10n, recipient: AUTHOR, copyNumber: 1n },
        1,
      ),
      copyPurchasedLog({ workId: 1n, tokenId: 10n, buyer: BUYER }, 2),
    ]);

    expect((await repos.tokens.getToken(10n))?.owner.toLowerCase()).toBe(BUYER);
    expect((await repos.works.getWork(1n))?.primarySaleRemaining).toBe(99n);
  });
});
