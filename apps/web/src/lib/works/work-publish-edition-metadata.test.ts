import { encodeAbiParameters, encodeEventTopics, type Log } from "viem";
import { describe, expect, it, vi } from "vitest";

import { andromedaWorksAbi } from "@/lib/chain/contract";

import { buildAcePublicMetadata } from "./publish-service";
import {
  completeEditionMetadataAfterRegister,
  writeCopyMetadataUris,
} from "./work-publish-edition-metadata";
import { parseWorkImprintFromFormValues } from "./work-imprint-metadata";

const CONTRACT = "0x1111111111111111111111111111111111111111" as const;
const AUTHOR = "0xabcdef0123456789abcdef0123456789abcdef01";
const REGISTRY = "0x000000006551c19487814612e58FE06813775758";

function workMetadata() {
  return buildAcePublicMetadata({
    name: "Story",
    workImprint: parseWorkImprintFromFormValues(
      {
        publicationDate: "2026-06-01",
        editionNumber: "1",
        editionKind: "first",
        reprintNumber: "",
        seriesName: "",
        seriesVolume: "",
        language: "",
        originalPublicationDate: "",
        backCoverText: "Back cover.",
        aboutAuthor: "About the author.",
      },
      AUTHOR,
    ),
    imageUri: "ipfs://cover",
    encryptedContentUri: "ipfs://cipher",
    chainId: 80002,
    contractAddress: CONTRACT,
    registryAddress: REGISTRY,
  });
}

function registerLogs(): Log[] {
  return [
    {
      address: CONTRACT,
      topics: encodeEventTopics({
        abi: andromedaWorksAbi,
        eventName: "WorkRegistered",
        args: { workId: 1n, author: AUTHOR },
      }) as [`0x${string}`, ...`0x${string}`[]],
      data: encodeAbiParameters(
        [{ type: "string" }, { type: "uint256" }, { type: "uint256" }],
        ["ipfs://work", 0n, 2n],
      ),
      blockHash:
        "0x0000000000000000000000000000000000000000000000000000000000000001",
      blockNumber: 1n,
      logIndex: 0,
      transactionHash:
        "0x0000000000000000000000000000000000000000000000000000000000000002",
      transactionIndex: 0,
      removed: false,
    },
    {
      address: CONTRACT,
      topics: encodeEventTopics({
        abi: andromedaWorksAbi,
        eventName: "CopyMinted",
        args: { workId: 1n, tokenId: 10n, recipient: AUTHOR },
      }) as [`0x${string}`, ...`0x${string}`[]],
      data: encodeAbiParameters([{ type: "uint256" }], [1n]),
      blockHash:
        "0x0000000000000000000000000000000000000000000000000000000000000001",
      blockNumber: 1n,
      logIndex: 1,
      transactionHash:
        "0x0000000000000000000000000000000000000000000000000000000000000002",
      transactionIndex: 0,
      removed: false,
    },
  ];
}

describe("writeCopyMetadataUris", () => {
  it("writes one on-chain metadata URI per copy and waits for each receipt", async () => {
    const writeContractAsync = vi
      .fn()
      .mockResolvedValueOnce("0xabc")
      .mockResolvedValueOnce("0xdef");
    const waitForTransactionReceipt = vi.fn().mockResolvedValue({});
    const onCopyWriteProgress = vi.fn();

    await writeCopyMetadataUris({
      copies: [
        { tokenId: 10n, copyNumber: 1, metadataUri: "ipfs://copy-1" },
        { tokenId: 11n, copyNumber: 2, metadataUri: "ipfs://copy-2" },
      ],
      contractAddress: CONTRACT,
      abi: andromedaWorksAbi,
      writeContractAsync,
      waitForTransactionReceipt,
      onCopyWriteProgress,
    });

    expect(writeContractAsync).toHaveBeenCalledTimes(2);
    expect(waitForTransactionReceipt).toHaveBeenCalledTimes(2);
    expect(waitForTransactionReceipt).toHaveBeenNthCalledWith(1, "0xabc");
    expect(waitForTransactionReceipt).toHaveBeenNthCalledWith(2, "0xdef");
    expect(onCopyWriteProgress).toHaveBeenCalledTimes(2);
  });
});

describe("completeEditionMetadataAfterRegister", () => {
  it("pins numbered metadata and writes token URIs", async () => {
    const writeContractAsync = vi.fn().mockResolvedValue("0xabc");
    const waitForTransactionReceipt = vi.fn().mockResolvedValue({});
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          copies: [
            {
              tokenId: "10",
              copyNumber: 1,
              metadataUri: "ipfs://copy-1",
            },
          ],
        }),
        { status: 201 },
      ),
    );

    const result = await completeEditionMetadataAfterRegister({
      logs: registerLogs(),
      authorAddress: AUTHOR,
      workMetadata: workMetadata(),
      maxCopies: 2n,
      walletAuth: {
        address: AUTHOR,
        signature: `0x${"11".repeat(65)}`,
        message: "test",
      },
      contractAddress: CONTRACT,
      abi: andromedaWorksAbi,
      writeContractAsync,
      waitForTransactionReceipt,
      fetchImpl,
    });

    expect(result).toEqual({ workId: 1n, labeledCopies: 1 });
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(writeContractAsync).toHaveBeenCalledOnce();
    expect(waitForTransactionReceipt).toHaveBeenCalledOnce();
  });
});
