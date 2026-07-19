import { encodeAbiParameters, encodeEventTopics, getAddress, type Log } from "viem";
import { describe, expect, it } from "vitest";

import { andromedaWorksAbi } from "@/lib/chain/contract";

import { WorkMintError } from "./errors";
import {
  extractRegisteredCopies,
  extractRegisteredWorkId,
  parseCopyMintedEvents,
} from "./register-receipt";

const CONTRACT = "0x1111111111111111111111111111111111111111" as const;
const AUTHOR = getAddress("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");

function copyMintedLog(args: {
  workId: bigint;
  tokenId: bigint;
  recipient: `0x${string}`;
  copyNumber: bigint;
  logIndex: number;
}): Log {
  return {
    address: CONTRACT,
    topics: encodeEventTopics({
      abi: andromedaWorksAbi,
      eventName: "CopyMinted",
      args: {
        workId: args.workId,
        tokenId: args.tokenId,
        recipient: args.recipient,
      },
    }) as [`0x${string}`, ...`0x${string}`[]],
    data: encodeAbiParameters([{ type: "uint256" }], [args.copyNumber]),
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
  it("decodes copy numbers from register logs", () => {
    const events = parseCopyMintedEvents([
      copyMintedLog({
        workId: 1n,
        tokenId: 10n,
        recipient: AUTHOR,
        copyNumber: 2n,
        logIndex: 0,
      }),
    ]);

    expect(events).toEqual([
      {
        workId: 1n,
        tokenId: 10n,
        recipient: AUTHOR,
        copyNumber: 2n,
      },
    ]);
  });
});

describe("extractRegisteredCopies", () => {
  it("sorts copies by ascending copy number", () => {
    const copies = extractRegisteredCopies([
      copyMintedLog({
        workId: 1n,
        tokenId: 12n,
        recipient: AUTHOR,
        copyNumber: 2n,
        logIndex: 1,
      }),
      copyMintedLog({
        workId: 1n,
        tokenId: 11n,
        recipient: AUTHOR,
        copyNumber: 1n,
        logIndex: 0,
      }),
    ]);

    expect(copies.map((copy) => Number(copy.copyNumber))).toEqual([1, 2]);
  });
});

describe("extractRegisteredWorkId", () => {
  it("throws when WorkRegistered is missing", () => {
    expect(() => extractRegisteredWorkId([])).toThrow(WorkMintError);
  });
});
