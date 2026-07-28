import { describe, expect, it } from "vitest";

import { generateContentKey } from "@/lib/content-crypto/ace-spec";
import { unwrapContentKey } from "@/lib/content-crypto/envelope";
import { createTbaKeyFixture } from "@/lib/content-crypto/testing/key-fixtures";
import { getInMemoryIpfsRecord } from "@/lib/ipfs/testing/in-memory-ipfs-storage";
import { createInMemoryPermanentStorage } from "@/lib/ipfs/testing/in-memory-permanent-storage";
import { createArweaveTurboStorage } from "@/lib/ipfs/adapters/arweave-turbo-storage";
import {
  createFakeTurboUploadClient,
  createFakeTurboUploadState,
} from "@/lib/ipfs/testing/fake-turbo-upload-client";

import { MintEnvelopeError } from "./errors";
import {
  createTokenEnvelope,
  provisionTokenEnvelope,
  reuseTokenEnvelope,
  tokenEnvelopePinName,
} from "./mint-envelope-service";

describe("tokenEnvelopePinName", () => {
  it("derives a deterministic pin name per token", () => {
    expect(tokenEnvelopePinName(42n)).toBe("token-42-envelope");
  });
});

describe("createTokenEnvelope", () => {
  it("wraps the content key for the TBA pubkey and uploads the envelope", async () => {
    const { storage, state } = createInMemoryPermanentStorage();
    const contentKey = generateContentKey();
    const tbaKeys = createTbaKeyFixture();

    const result = await createTokenEnvelope(storage, {
      tokenId: 7n,
      contentKey,
      recipientPublicKey: tbaKeys.publicKey,
    });

    expect(result.tokenId).toBe(7n);
    expect(result.reused).toBe(false);
    expect(result.envelopeUri).toBe(`ipfs://${result.envelopeCid}`);

    const record = getInMemoryIpfsRecord(state, result.envelopeCid);
    expect(record).toBeDefined();
    expect(record?.name).toBe("token-7-envelope");

    const unwrapped = unwrapContentKey(record!.bytes, tbaKeys.privateKey);
    expect(unwrapped).toEqual(contentKey);
  });

  it("uploads ar:// envelopes when using the Arweave adapter", async () => {
    const storage = createArweaveTurboStorage({
      client: createFakeTurboUploadClient(createFakeTurboUploadState()),
    });

    const result = await createTokenEnvelope(storage, {
      tokenId: 7n,
      contentKey: generateContentKey(),
      recipientPublicKey: createTbaKeyFixture().publicKey,
    });

    expect(result.envelopeUri).toMatch(/^ar:\/\//);
  });

  it("rejects an invalid content key length", async () => {
    const { storage } = createInMemoryPermanentStorage();

    await expect(
      createTokenEnvelope(storage, {
        tokenId: 1n,
        contentKey: new Uint8Array(16),
        recipientPublicKey: createTbaKeyFixture().publicKey,
      }),
    ).rejects.toBeInstanceOf(MintEnvelopeError);
  });

  it("rejects a negative token id", async () => {
    const { storage } = createInMemoryPermanentStorage();

    await expect(
      createTokenEnvelope(storage, {
        tokenId: -1n,
        contentKey: generateContentKey(),
        recipientPublicKey: createTbaKeyFixture().publicKey,
      }),
    ).rejects.toBeInstanceOf(MintEnvelopeError);
  });
});

describe("reuseTokenEnvelope", () => {
  it("builds a reused result from an existing envelope URI", () => {
    const result = reuseTokenEnvelope(5n, "ar://ExistingTx");

    expect(result).toEqual({
      tokenId: 5n,
      envelopeCid: "ExistingTx",
      envelopeUri: "ar://ExistingTx",
      reused: true,
    });
  });
});

describe("provisionTokenEnvelope", () => {
  it("uploads a new envelope when none exists yet", async () => {
    const { storage, state } = createInMemoryPermanentStorage();

    const result = await provisionTokenEnvelope(storage, {
      tokenId: 9n,
      contentKey: generateContentKey(),
      recipientPublicKey: createTbaKeyFixture().publicKey,
    });

    expect(result.reused).toBe(false);
    expect(state.records.size).toBe(1);
  });

  it("reuses an existing envelope without uploading again (idempotent)", async () => {
    const { storage, state } = createInMemoryPermanentStorage();

    const result = await provisionTokenEnvelope(storage, {
      tokenId: 9n,
      contentKey: generateContentKey(),
      recipientPublicKey: createTbaKeyFixture().publicKey,
      existingEnvelopeUri: "ipfs://bafyExisting",
    });

    expect(result.reused).toBe(true);
    expect(result.envelopeUri).toBe("ipfs://bafyExisting");
    expect(state.records.size).toBe(0);
  });
});
