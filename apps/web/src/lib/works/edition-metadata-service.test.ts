import { describe, expect, it } from "vitest";

import { WalletAuthorizationError } from "@/lib/auth/errors";
import { createInMemoryIpfsStorage, createInMemoryIpfsState, getInMemoryIpfsRecord } from "@/lib/ipfs/testing/in-memory-ipfs-storage";

import { provisionEditionMetadata } from "./edition-metadata-service";
import { buildAcePublicMetadata } from "./publish-service";
import { COPY_NUMBER_TRAIT, EDITION_SIZE_TRAIT } from "./token-metadata";
import { parseWorkImprintFromFormValues } from "./work-imprint-metadata";

const AUTHOR = "0xabcdef0123456789abcdef0123456789abcdef01";
const OTHER = "0x1234567890abcdef1234567890abcdef12345678";
const CONTRACT = "0x1111111111111111111111111111111111111111" as const;
const REGISTRY = "0x000000006551c19487814612e58FE06813775758";

function workMetadata() {
  return buildAcePublicMetadata({
    name: "The Star Gate",
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
        backCoverText: "An encrypted science-fiction novella.",
        aboutAuthor: "The author explores distant worlds.",
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

describe("provisionEditionMetadata", () => {
  it("pins numbered metadata for each copy", async () => {
    const ipfs = createInMemoryIpfsStorage(createInMemoryIpfsState());
    const results = await provisionEditionMetadata(ipfs, {
      signerAddress: AUTHOR,
      authorAddress: AUTHOR,
      workMetadata: workMetadata(),
      maxCopies: 3n,
      copies: [
        { tokenId: 1n, copyNumber: 1 },
        { tokenId: 2n, copyNumber: 2 },
      ],
    });

    expect(results).toHaveLength(2);
    expect(results[0].metadataUri).toMatch(/^ipfs:\/\//);
    expect(results[1].copyNumber).toBe(2);
  });

  it("rejects non-author signers", async () => {
    const ipfs = createInMemoryIpfsStorage();
    await expect(
      provisionEditionMetadata(ipfs, {
        signerAddress: OTHER,
        authorAddress: AUTHOR,
        workMetadata: workMetadata(),
        maxCopies: 1n,
        copies: [{ tokenId: 1n, copyNumber: 1 }],
      }),
    ).rejects.toThrow(WalletAuthorizationError);
  });

  it("embeds copy number traits in pinned metadata", async () => {
    const state = createInMemoryIpfsState();
    const ipfs = createInMemoryIpfsStorage(state);
    const [result] = await provisionEditionMetadata(ipfs, {
      signerAddress: AUTHOR,
      authorAddress: AUTHOR,
      workMetadata: workMetadata(),
      maxCopies: 5n,
      copies: [{ tokenId: 9n, copyNumber: 3 }],
    });

    const record = getInMemoryIpfsRecord(state, result.metadataUri.replace("ipfs://", ""));
    expect(record).toBeDefined();
    const pinned = JSON.parse(new TextDecoder().decode(record!.bytes)) as {
      name: string;
      attributes: Array<{ trait_type: string; value: string | number }>;
    };
    expect(pinned.attributes).toEqual(
      expect.arrayContaining([
        { trait_type: COPY_NUMBER_TRAIT, value: 3 },
        { trait_type: EDITION_SIZE_TRAIT, value: "5" },
      ]),
    );
    expect(pinned.name).toContain("Copy #3 / 5");
  });
});
