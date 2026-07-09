import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { getAddress } from "viem";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { ChainSyncModel } from "@/lib/db/models/chain-sync.model";
import { TokenModel } from "@/lib/db/models/token.model";
import { WorkModel } from "@/lib/db/models/work.model";
import { resetMongoConnectionForTests } from "@/lib/db/mongodb";

import { createMongoIndexerRepositories } from "./create-indexer-repositories";

const AUTHOR = "0xABCDEF0123456789abcdef0123456789abcdef01";
const OWNER = "0x2222222222222222222222222222222222222222";
const OWNER2 = "0x3333333333333333333333333333333333333333";

describe("mongo indexer repositories", () => {
  let memoryServer: MongoMemoryServer | undefined;

  beforeAll(async () => {
    memoryServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = memoryServer.getUri();
    resetMongoConnectionForTests();
  }, 120_000);

  afterEach(async () => {
    await WorkModel.deleteMany({});
    await TokenModel.deleteMany({});
    await ChainSyncModel.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
    resetMongoConnectionForTests();
    await memoryServer?.stop();
  });

  it("upserts works idempotently and preserves minted across re-runs", async () => {
    const { works } = await createMongoIndexerRepositories();

    const created = await works.upsertWork({
      workId: 1n,
      author: AUTHOR,
      metadataURI: "ipfs://meta",
      price: 1000n,
      maxCopies: 100n,
    });
    expect(created.minted).toBe(0n);
    expect(created.active).toBe(true);

    await works.setMinted(1n, 3n);

    const reupserted = await works.upsertWork({
      workId: 1n,
      author: AUTHOR,
      metadataURI: "ipfs://meta-v2",
      price: 2000n,
      maxCopies: 100n,
    });
    expect(reupserted.minted).toBe(3n);
    expect(reupserted.metadataURI).toBe("ipfs://meta-v2");
    expect(reupserted.price).toBe(2000n);

    expect(await WorkModel.countDocuments({})).toBe(1);
  });

  it("toggles active and lists works", async () => {
    const { works } = await createMongoIndexerRepositories();
    await works.upsertWork({
      workId: 1n,
      author: AUTHOR,
      metadataURI: "ipfs://a",
      price: 1n,
      maxCopies: 0n,
    });
    await works.setActive(1n, false);

    const fetched = await works.getWork(1n);
    expect(fetched?.active).toBe(false);
    expect(fetched?.author).toBe(getAddress(AUTHOR));
    expect(await works.getWork(2n)).toBeNull();
    expect(await works.listWorks()).toHaveLength(1);
  });

  it("upserts tokens and updates owner only when present", async () => {
    const { tokens } = await createMongoIndexerRepositories();

    await tokens.upsertToken({
      tokenId: 42n,
      workId: 1n,
      owner: OWNER,
      copyNumber: 1,
    });

    expect(await tokens.setOwner(42n, OWNER2)).toBe(true);
    expect(await tokens.setOwner(999n, OWNER2)).toBe(false);

    const token = await tokens.getToken(42n);
    expect(token?.owner).toBe(OWNER2);
    expect(token?.copyNumber).toBe(1);
    expect(token?.metadataURI).toBeNull();
    expect((await tokens.listByOwner(OWNER2)).map((t) => t.tokenId)).toEqual([
      42n,
    ]);
  });

  it("sets a token metadata URI only when the token exists", async () => {
    const { tokens } = await createMongoIndexerRepositories();
    await tokens.upsertToken({ tokenId: 42n, workId: 1n, owner: OWNER });

    expect(await tokens.setMetadataURI(42n, "ipfs://token-42")).toBe(true);
    expect(await tokens.setMetadataURI(999n, "ipfs://ghost")).toBe(false);

    expect((await tokens.getToken(42n))?.metadataURI).toBe("ipfs://token-42");
  });

  it("tracks the chain sync cursor", async () => {
    const { chainSync } = await createMongoIndexerRepositories();
    expect(await chainSync.getLastProcessedBlock()).toBe(0n);

    await chainSync.setLastProcessedBlock(500n);
    await chainSync.setLastProcessedBlock(750n);

    expect(await chainSync.getLastProcessedBlock()).toBe(750n);
    expect(await ChainSyncModel.countDocuments({})).toBe(1);
  });
});
