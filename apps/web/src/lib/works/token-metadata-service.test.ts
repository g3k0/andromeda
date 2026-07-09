import { describe, expect, it } from "vitest";

import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";
import {
  createInMemoryIpfsState,
  createInMemoryIpfsStorage,
  getInMemoryIpfsRecord,
} from "@/lib/ipfs/testing/in-memory-ipfs-storage";

import { buildAcePublicMetadata } from "./publish-service";
import {
  provisionTokenMetadata,
  tokenMetadataPinName,
} from "./token-metadata-service";
import { parseWorkImprintFromFormValues } from "./work-imprint-metadata";

const CONTRACT = "0x1111111111111111111111111111111111111111" as const;
const REGISTRY = "0x2222222222222222222222222222222222222222" as const;
const AUTHOR = "0xabcdef0123456789abcdef0123456789abcdef01";

function workMetadata(): AcePublicMetadata {
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
    imageUri: "ipfs://bafyCover",
    encryptedContentUri: "ipfs://bafyContent",
    chainId: 80002,
    contractAddress: CONTRACT,
    registryAddress: REGISTRY,
  });
}

describe("tokenMetadataPinName", () => {
  it("derives a deterministic pin name per token", () => {
    expect(tokenMetadataPinName(42n)).toBe("token-42-metadata");
  });
});

describe("provisionTokenMetadata", () => {
  it("builds and pins numbered metadata", async () => {
    const state = createInMemoryIpfsState();
    const ipfs = createInMemoryIpfsStorage(state);

    const result = await provisionTokenMetadata(ipfs, {
      tokenId: 5n,
      workMetadata: workMetadata(),
      copyNumber: 2,
      maxCopies: 10n,
    });

    expect(result.reused).toBe(false);
    expect(result.metadataUri).toMatch(/^ipfs:\/\//);
    expect(result.metadata?.name).toBe("The Star Gate — Copy #2 / 10");
    expect(getInMemoryIpfsRecord(state, result.metadataCid)).toBeDefined();
  });

  it("reuses an existing metadata URI without pinning", async () => {
    const state = createInMemoryIpfsState();
    const ipfs = createInMemoryIpfsStorage(state);

    const result = await provisionTokenMetadata(ipfs, {
      tokenId: 5n,
      workMetadata: workMetadata(),
      copyNumber: 2,
      maxCopies: 10n,
      existingMetadataUri: "ipfs://bafyExisting",
    });

    expect(result.reused).toBe(true);
    expect(result.metadataUri).toBe("ipfs://bafyExisting");
    expect(result.metadata).toBeNull();
    expect(state.records.size).toBe(0);
  });
});
