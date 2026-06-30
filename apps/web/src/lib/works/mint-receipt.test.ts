import { encodeEventTopics, type Log } from "viem";
import { describe, expect, it } from "vitest";

import { andromedaWorksAbi } from "@/lib/chain/contract";

import { WorkMintError } from "./errors";
import { extractMintedTokenId, parseCopyMintedEvents } from "./mint-receipt";

const CONTRACT = "0x1111111111111111111111111111111111111111" as const;
const BUYER = "0x2222222222222222222222222222222222222222" as const;
const OTHER_BUYER = "0x3333333333333333333333333333333333333333" as const;

function copyMintedLog(args: {
  workId: bigint;
  tokenId: bigint;
  buyer: `0x${string}`;
  logIndex: number;
}): Log {
  return {
    address: CONTRACT,
    topics: encodeEventTopics({
      abi: andromedaWorksAbi,
      eventName: "CopyMinted",
      args: { workId: args.workId, tokenId: args.tokenId, buyer: args.buyer },
    }) as [`0x${string}`, ...`0x${string}`[]],
    data: "0x",
    blockHash:
      "0x0000000000000000000000000000000000000000000000000000000000000001",
    blockNumber: 1n,
    logIndex: args.logIndex,
    transactionHash:
      "0x0000000000000000000000000000000000000000000000000000000000000002",
    transactionIndex: 0,
    removed: false,
  };
}

describe("parseCopyMintedEvents", () => {
  it("decodes CopyMinted events and ignores unrelated logs", () => {
    const unrelated: Log = {
      address: CONTRACT,
      topics: ["0xdeadbeef"],
      data: "0x",
      blockHash:
        "0x0000000000000000000000000000000000000000000000000000000000000001",
      blockNumber: 1n,
      logIndex: 9,
      transactionHash:
        "0x0000000000000000000000000000000000000000000000000000000000000002",
      transactionIndex: 0,
      removed: false,
    };

    const events = parseCopyMintedEvents([
      unrelated,
      copyMintedLog({ workId: 3n, tokenId: 42n, buyer: BUYER, logIndex: 0 }),
    ]);

    expect(events).toEqual([{ workId: 3n, tokenId: 42n, buyer: BUYER }]);
  });
});

describe("extractMintedTokenId", () => {
  it("returns the token id from the first matching event", () => {
    const tokenId = extractMintedTokenId([
      copyMintedLog({ workId: 3n, tokenId: 42n, buyer: BUYER, logIndex: 0 }),
    ]);

    expect(tokenId).toBe(42n);
  });

  it("narrows by workId and buyer when several copies mint", () => {
    const logs = [
      copyMintedLog({ workId: 1n, tokenId: 10n, buyer: OTHER_BUYER, logIndex: 0 }),
      copyMintedLog({ workId: 3n, tokenId: 55n, buyer: BUYER, logIndex: 1 }),
    ];

    expect(extractMintedTokenId(logs, { workId: 3n, buyer: BUYER })).toBe(55n);
    expect(
      extractMintedTokenId(logs, { workId: 3n, buyer: BUYER.toUpperCase() }),
    ).toBe(55n);
  });

  it("throws when no CopyMinted event matches", () => {
    expect(() => extractMintedTokenId([])).toThrow(WorkMintError);
    expect(() =>
      extractMintedTokenId(
        [copyMintedLog({ workId: 1n, tokenId: 10n, buyer: BUYER, logIndex: 0 })],
        { workId: 99n },
      ),
    ).toThrow(WorkMintError);
  });
});
