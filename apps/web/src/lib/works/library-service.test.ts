import { describe, expect, it } from "vitest";

import { listLibraryCopies } from "./library-service";
import { createInMemoryIndexerRepositories } from "./testing/in-memory-indexer-repositories";

const OWNER = "0x2222222222222222222222222222222222222222";
const OTHER = "0x3333333333333333333333333333333333333333";

describe("library service", () => {
  it("returns the copies owned by an address enriched with edition size", async () => {
    const repos = createInMemoryIndexerRepositories();
    await repos.works.upsertWork({
      workId: 7n,
      author: OTHER,
      metadataURI: "ipfs://work-7",
      price: 0n,
      maxCopies: 10n,
    });
    await repos.tokens.upsertToken({
      tokenId: 1n,
      workId: 7n,
      owner: OWNER,
      copyNumber: 1,
      envelopeCid: "bafyenvelope",
      metadataURI: "ipfs://token-1",
    });
    await repos.tokens.upsertToken({
      tokenId: 2n,
      workId: 8n,
      owner: OTHER,
      copyNumber: 1,
    });

    const copies = await listLibraryCopies(repos, OWNER);
    expect(copies).toHaveLength(1);
    expect(copies[0]).toMatchObject({
      tokenId: "1",
      workId: "7",
      copyNumber: 1,
      envelopeCid: "bafyenvelope",
      metadataURI: "ipfs://token-1",
      editionSize: "10",
    });
  });

  it("reports a null edition size for open editions", async () => {
    const repos = createInMemoryIndexerRepositories();
    await repos.works.upsertWork({
      workId: 9n,
      author: OTHER,
      metadataURI: "ipfs://work-9",
      price: 0n,
      maxCopies: 0n,
    });
    await repos.tokens.upsertToken({
      tokenId: 3n,
      workId: 9n,
      owner: OWNER,
      copyNumber: 4,
    });

    const copies = await listLibraryCopies(repos, OWNER);
    expect(copies[0].editionSize).toBeNull();
  });

  it("returns an empty list when the address owns nothing", async () => {
    const repos = createInMemoryIndexerRepositories();
    expect(await listLibraryCopies(repos, OWNER)).toEqual([]);
  });
});
