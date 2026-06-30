import { describe, expect, it } from "vitest";

import {
  ANDROMEDA_WORKS_SYNC_KEY,
  CHAIN_SYNC_COLLECTION_NAME,
  ChainSyncModel,
} from "./chain-sync.model";
import { TOKEN_COLLECTION_NAME, TokenModel } from "./token.model";
import { WORK_COLLECTION_NAME, WorkModel } from "./work.model";

describe("indexer models", () => {
  it("uses explicit collection names", () => {
    expect(WORK_COLLECTION_NAME).toBe("works");
    expect(WorkModel.collection.name).toBe("works");
    expect(TOKEN_COLLECTION_NAME).toBe("tokens");
    expect(TokenModel.collection.name).toBe("tokens");
    expect(CHAIN_SYNC_COLLECTION_NAME).toBe("chain_sync");
    expect(ChainSyncModel.collection.name).toBe("chain_sync");
    expect(ANDROMEDA_WORKS_SYNC_KEY).toBe("andromeda-works");
  });

  it("marks workId and tokenId as unique", () => {
    expect(WorkModel.schema.path("workId").options.unique).toBe(true);
    expect(TokenModel.schema.path("tokenId").options.unique).toBe(true);
  });

  it("requires core work fields", () => {
    const error = new WorkModel({}).validateSync();
    expect(error?.errors.workId).toBeDefined();
    expect(error?.errors.author).toBeDefined();
    expect(error?.errors.metadataURI).toBeDefined();
    expect(error?.errors.price).toBeDefined();
    expect(error?.errors.maxCopies).toBeDefined();
  });

  it("defaults work minted to 0 and active to true", () => {
    const work = new WorkModel({
      workId: "1",
      author: "0xABCDEF0123456789abcdef0123456789abcdef01",
      metadataURI: "ipfs://meta",
      price: "1000",
      maxCopies: "100",
    });
    expect(work.minted).toBe("0");
    expect(work.active).toBe(true);
    expect(work.author).toBe("0xabcdef0123456789abcdef0123456789abcdef01");
  });

  it("requires token identity fields", () => {
    const error = new TokenModel({}).validateSync();
    expect(error?.errors.tokenId).toBeDefined();
    expect(error?.errors.workId).toBeDefined();
    expect(error?.errors.owner).toBeDefined();
  });

  it("defaults the chain sync cursor to block 0", () => {
    const cursor = new ChainSyncModel({ key: ANDROMEDA_WORKS_SYNC_KEY });
    expect(cursor.lastProcessedBlock).toBe("0");
  });
});
