import { describe, expect, it } from "vitest";

import { generateContentKey } from "@/lib/content-crypto/ace-spec";
import { unwrapContentKey } from "@/lib/content-crypto/envelope";
import { createTbaKeyFixture } from "@/lib/content-crypto/testing/key-fixtures";
import {
  createInMemoryIpfsState,
  createInMemoryIpfsStorage,
  getInMemoryIpfsRecord,
} from "@/lib/ipfs/testing/in-memory-ipfs-storage";

import { MintEnvelopeError } from "./errors";
import {
  createTokenEnvelope,
  tokenEnvelopePinName,
} from "./mint-envelope-service";

describe("tokenEnvelopePinName", () => {
  it("derives a deterministic pin name per token", () => {
    expect(tokenEnvelopePinName(42n)).toBe("token-42-envelope");
  });
});

describe("createTokenEnvelope", () => {
  it("wraps the content key for the TBA pubkey and pins the envelope", async () => {
    const state = createInMemoryIpfsState();
    const ipfs = createInMemoryIpfsStorage(state);
    const contentKey = generateContentKey();
    const tbaKeys = createTbaKeyFixture();

    const result = await createTokenEnvelope(ipfs, {
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

  it("rejects an invalid content key length", async () => {
    const ipfs = createInMemoryIpfsStorage(createInMemoryIpfsState());

    await expect(
      createTokenEnvelope(ipfs, {
        tokenId: 1n,
        contentKey: new Uint8Array(16),
        recipientPublicKey: createTbaKeyFixture().publicKey,
      }),
    ).rejects.toBeInstanceOf(MintEnvelopeError);
  });

  it("rejects a negative token id", async () => {
    const ipfs = createInMemoryIpfsStorage(createInMemoryIpfsState());

    await expect(
      createTokenEnvelope(ipfs, {
        tokenId: -1n,
        contentKey: generateContentKey(),
        recipientPublicKey: createTbaKeyFixture().publicKey,
      }),
    ).rejects.toBeInstanceOf(MintEnvelopeError);
  });
});
