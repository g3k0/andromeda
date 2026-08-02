import { describe, expect, it } from "vitest";

import { buildContinuityIndex } from "./continuity-export";
import type { TokenRecord, WorkRecord } from "./types";

function work(overrides: Partial<WorkRecord> = {}): WorkRecord {
  return {
    workId: 1n,
    author: "0x1111111111111111111111111111111111111111",
    metadataURI: "ar://WorkMeta",
    encryptedContentCid: "ar://Cipher",
    price: 0n,
    maxCopies: 10n,
    minted: 1n,
    primarySaleRemaining: 9n,
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function token(overrides: Partial<TokenRecord> = {}): TokenRecord {
  return {
    tokenId: 10n,
    workId: 1n,
    owner: "0x2222222222222222222222222222222222222222",
    copyNumber: 1,
    tbaAddress: null,
    envelopeCid: "ar://Envelope",
    envelopeRecipientPublicKey: null,
    metadataURI: "ar://TokenMeta",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildContinuityIndex", () => {
  it("groups tokens under works and sorts by id", () => {
    const index = buildContinuityIndex({
      works: [work({ workId: 2n }), work({ workId: 1n })],
      tokens: [
        token({ tokenId: 12n, workId: 1n }),
        token({ tokenId: 11n, workId: 1n }),
        token({ tokenId: 20n, workId: 2n, envelopeCid: null }),
      ],
      generatedAt: "2026-08-02T00:00:00.000Z",
      chainId: 137,
      contractAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    });

    expect(index.schema).toBe("andromeda.continuity.v1");
    expect(index.works.map((w) => w.workId)).toEqual(["1", "2"]);
    expect(index.works[0]?.tokens.map((t) => t.tokenId)).toEqual(["11", "12"]);
    expect(index.works[0]?.tokens[0]?.envelopeURI).toBe("ar://Envelope");
    expect(index.works[1]?.tokens[0]?.envelopeURI).toBeNull();
    expect(index.chainId).toBe(137);
  });
});
