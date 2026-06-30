import { encodeEventTopics, type Log } from "viem";
import { describe, expect, it } from "vitest";

import { generateContentKey } from "@/lib/content-crypto/ace-spec";
import {
  decodeUtf8Plaintext,
  encodeUtf8Plaintext,
  encryptContent,
} from "@/lib/content-crypto/content-cipher";
import { decryptWorkContent } from "@/lib/content-crypto/decrypt-workflow";
import { unwrapContentKey } from "@/lib/content-crypto/envelope";
import { createTbaKeyFixture } from "@/lib/content-crypto/testing/key-fixtures";
import type { TbaEnvelopeSigner } from "@/lib/content-crypto/tba-envelope-signer";
import { andromedaWorksAbi } from "@/lib/chain/contract";
import {
  createInMemoryIpfsState,
  createInMemoryIpfsStorage,
  getInMemoryIpfsRecord,
} from "@/lib/ipfs/testing/in-memory-ipfs-storage";
import { createInMemoryTba } from "@/lib/tba/testing/in-memory-tba";
import type { Erc6551RegistryConfig } from "@/lib/tba/tba-registry";

import { createMintEnvelopeFromSession } from "./mint-envelope-client";
import { extractMintedTokenId } from "./mint-receipt";
import { buildTokenTbaLookup, planTokenTbaDeployment } from "./mint-tba-deploy";
import { publishWorkToIpfs } from "./publish-service";
import { parseWorkImprintFromFormValues } from "./work-imprint-metadata";

const CONTRACT = "0x1111111111111111111111111111111111111111" as const;
const REGISTRY = "0x000000006551c19487814612e58FE06813775758" as const;
const IMPLEMENTATION = "0x55266d75D1a14E4572138116aF39863Ed6596E7F" as const;
const AUTHOR = "0xabcdef0123456789abcdef0123456789abcdef01";
const BUYER = "0x2222222222222222222222222222222222222222" as const;
const CHAIN_ID = 80002;

const CONFIG: Erc6551RegistryConfig = {
  registry: REGISTRY,
  implementation: IMPLEMENTATION,
  chainId: CHAIN_ID,
};

function copyMintedLog(workId: bigint, tokenId: bigint): Log {
  return {
    address: CONTRACT,
    topics: encodeEventTopics({
      abi: andromedaWorksAbi,
      eventName: "CopyMinted",
      args: { workId, tokenId, buyer: BUYER },
    }) as [`0x${string}`, ...`0x${string}`[]],
    data: "0x",
    blockHash:
      "0x0000000000000000000000000000000000000000000000000000000000000001",
    blockNumber: 1n,
    logIndex: 0,
    transactionHash:
      "0x0000000000000000000000000000000000000000000000000000000000000002",
    transactionIndex: 0,
    removed: false,
  };
}

function workImprint() {
  return parseWorkImprintFromFormValues(
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
  );
}

describe("mint flow integration", () => {
  it("mints, derives TBA, pins envelope, and decrypts content end-to-end", async () => {
    const state = createInMemoryIpfsState();
    const ipfs = createInMemoryIpfsStorage(state);

    // 1. Author publishes the encrypted work; K stays local.
    const plaintext = "Once upon a time in a distant galaxy…";
    const contentKey = generateContentKey();
    const ciphertext = await encryptContent(
      encodeUtf8Plaintext(plaintext),
      contentKey,
    );
    const published = await publishWorkToIpfs(ipfs, {
      ciphertext,
      coverImage: encodeUtf8Plaintext("fake-png"),
      name: "The Star Gate",
      workImprint: workImprint(),
      chainId: CHAIN_ID,
      contractAddress: CONTRACT,
      registryAddress: REGISTRY,
    });

    // 2. Buyer mints copy → tokenId from CopyMinted log.
    const tokenId = extractMintedTokenId([copyMintedLog(1n, 42n)], {
      workId: 1n,
      buyer: BUYER,
    });
    expect(tokenId).toBe(42n);

    // 3. Deterministic TBA + deploy plan (not yet deployed).
    const tba = createInMemoryTba({ config: CONFIG });
    const lookup = buildTokenTbaLookup({
      chainId: CHAIN_ID,
      tokenContract: CONTRACT,
      tokenId,
    });
    const plan = await planTokenTbaDeployment(tba, lookup);
    expect(plan.alreadyDeployed).toBe(false);
    expect(plan.deployTransaction).not.toBeNull();

    // 4. Author wraps K for the token's TBA identity and pins the envelope.
    const tbaKeys = createTbaKeyFixture();
    const envelopeResult = await createMintEnvelopeFromSession(
      { ipfs, loadContentKey: () => contentKey },
      {
        metadataUri: published.metadataUri,
        tokenId,
        resolveRecipientPublicKey: () => tbaKeys.publicKey,
      },
    );
    expect(envelopeResult.reused).toBe(false);

    // 5. Reader downloads envelope + ciphertext from IPFS and decrypts locally.
    const envelopeBytes = getInMemoryIpfsRecord(
      state,
      envelopeResult.envelopeCid,
    )!.bytes;
    const tbaSigner: TbaEnvelopeSigner = {
      async unwrapEnvelope(envelope) {
        return unwrapContentKey(envelope, tbaKeys.privateKey);
      },
    };

    const decrypted = await decryptWorkContent({
      ciphertext,
      envelope: envelopeBytes,
      tbaSigner,
    });

    expect(decodeUtf8Plaintext(decrypted)).toBe(plaintext);
    // Public metadata never leaks the plaintext or key.
    expect(JSON.stringify(published.metadata)).not.toContain(plaintext);
  });

  it("reuses an existing envelope on a repeated mint completion (idempotent)", async () => {
    const state = createInMemoryIpfsState();
    const ipfs = createInMemoryIpfsStorage(state);
    const contentKey = generateContentKey();
    const tbaKeys = createTbaKeyFixture();

    const first = await createMintEnvelopeFromSession(
      { ipfs, loadContentKey: () => contentKey },
      {
        metadataUri: "ipfs://bafyMeta",
        tokenId: 7n,
        resolveRecipientPublicKey: () => tbaKeys.publicKey,
      },
    );

    const recordsAfterFirst = state.records.size;

    const second = await createMintEnvelopeFromSession(
      { ipfs, loadContentKey: () => contentKey },
      {
        metadataUri: "ipfs://bafyMeta",
        tokenId: 7n,
        resolveRecipientPublicKey: () => tbaKeys.publicKey,
        existingEnvelopeUri: first.envelopeUri,
      },
    );

    expect(second.reused).toBe(true);
    expect(second.envelopeUri).toBe(first.envelopeUri);
    expect(state.records.size).toBe(recordsAfterFirst);
  });
});
