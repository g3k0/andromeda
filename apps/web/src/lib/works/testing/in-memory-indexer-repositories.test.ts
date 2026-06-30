import { getAddress } from "viem";
import { describe, expect, it } from "vitest";

import { createInMemoryIndexerRepositories } from "./in-memory-indexer-repositories";

const AUTHOR = "0xABCDEF0123456789abcdef0123456789abcdef01";
const OWNER = "0x2222222222222222222222222222222222222222";
const OWNER2 = "0x3333333333333333333333333333333333333333";

function baseWork() {
  return {
    workId: 1n,
    author: AUTHOR,
    metadataURI: "ipfs://meta",
    price: 1000n,
    maxCopies: 100n,
  };
}

describe("in-memory indexer repositories", () => {
  it("inserts a work with defaults and preserves minted on update", async () => {
    const { works } = createInMemoryIndexerRepositories();

    const created = await works.upsertWork(baseWork());
    expect(created.minted).toBe(0n);
    expect(created.active).toBe(true);
    expect(created.author).toBe(getAddress(AUTHOR));

    await works.setMinted(1n, 5n);
    const updated = await works.upsertWork({
      ...baseWork(),
      metadataURI: "ipfs://meta-v2",
    });

    expect(updated.minted).toBe(5n);
    expect(updated.metadataURI).toBe("ipfs://meta-v2");
  });

  it("toggles work active status", async () => {
    const { works } = createInMemoryIndexerRepositories();
    await works.upsertWork(baseWork());

    await works.setActive(1n, false);
    expect((await works.getWork(1n))?.active).toBe(false);
  });

  it("lists works and returns null for unknown work", async () => {
    const { works } = createInMemoryIndexerRepositories();
    await works.upsertWork(baseWork());
    await works.upsertWork({ ...baseWork(), workId: 2n });

    expect((await works.listWorks()).map((w) => w.workId)).toEqual([1n, 2n]);
    expect(await works.getWork(99n)).toBeNull();
  });

  it("upserts tokens and updates owner only when present", async () => {
    const { tokens } = createInMemoryIndexerRepositories();

    const token = await tokens.upsertToken({
      tokenId: 42n,
      workId: 1n,
      owner: OWNER,
      copyNumber: 1,
    });
    expect(token.copyNumber).toBe(1);
    expect(token.owner).toBe("0x2222222222222222222222222222222222222222");

    expect(await tokens.setOwner(42n, OWNER2)).toBe(true);
    expect(await tokens.setOwner(999n, OWNER2)).toBe(false);

    expect((await tokens.getToken(42n))?.owner).toBe(
      "0x3333333333333333333333333333333333333333",
    );
  });

  it("lists tokens by owner regardless of address casing", async () => {
    const { tokens } = createInMemoryIndexerRepositories();
    await tokens.upsertToken({ tokenId: 1n, workId: 1n, owner: OWNER });
    await tokens.upsertToken({ tokenId: 2n, workId: 1n, owner: OWNER2 });

    const owned = await tokens.listByOwner(OWNER.toUpperCase());
    expect(owned.map((t) => t.tokenId)).toEqual([1n]);
  });

  it("tracks the chain sync cursor", async () => {
    const { chainSync } = createInMemoryIndexerRepositories();
    expect(await chainSync.getLastProcessedBlock()).toBe(0n);

    await chainSync.setLastProcessedBlock(123n);
    expect(await chainSync.getLastProcessedBlock()).toBe(123n);
  });
});
