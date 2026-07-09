import { describe, expect, it } from "vitest";

import { workRecordToOnChain } from "./work-onchain-mapper";
import type { WorkRecord } from "./types";

describe("workRecordToOnChain", () => {
  it("maps the indexed projection to the on-chain shape", () => {
    const record: WorkRecord = {
      workId: 3n,
      author: "0x1111111111111111111111111111111111111111",
      metadataURI: "ipfs://meta",
      encryptedContentCid: "bafyciphertext",
      price: 500n,
      maxCopies: 10n,
      minted: 4n,
      active: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    expect(workRecordToOnChain(record)).toEqual({
      workId: 3n,
      author: "0x1111111111111111111111111111111111111111",
      metadataURI: "ipfs://meta",
      price: 500n,
      maxCopies: 10n,
      minted: 4n,
      active: true,
    });
  });
});
