import { describe, expect, it } from "vitest";

import { listLibraryCopies } from "./library-service";
import { createInMemoryIndexerRepositories } from "./testing/in-memory-indexer-repositories";

const OWNER = "0x2222222222222222222222222222222222222222";
const OTHER = "0x3333333333333333333333333333333333333333";

describe("library service", () => {
  it("returns the copies owned by an address as public DTOs", async () => {
    const repos = createInMemoryIndexerRepositories();
    await repos.tokens.upsertToken({
      tokenId: 1n,
      workId: 7n,
      owner: OWNER,
      copyNumber: 1,
      envelopeCid: "bafyenvelope",
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
    });
  });

  it("returns an empty list when the address owns nothing", async () => {
    const repos = createInMemoryIndexerRepositories();
    expect(await listLibraryCopies(repos, OWNER)).toEqual([]);
  });
});
