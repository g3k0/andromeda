import { describe, expect, it } from "vitest";

import { getPublicWork, listPublicWorks } from "./catalog-service";
import { createInMemoryIndexerRepositories } from "./testing/in-memory-indexer-repositories";

const AUTHOR = "0x1111111111111111111111111111111111111111";

async function seedWorks() {
  const repos = createInMemoryIndexerRepositories();
  await repos.works.upsertWork({
    workId: 1n,
    author: AUTHOR,
    metadataURI: "ipfs://one",
    price: 10n,
    maxCopies: 5n,
  });
  await repos.works.upsertWork({
    workId: 2n,
    author: AUTHOR,
    metadataURI: "ipfs://two",
    price: 20n,
    maxCopies: 0n,
    active: false,
  });
  return repos;
}

describe("catalog service", () => {
  it("lists only active works as public DTOs", async () => {
    const repos = await seedWorks();
    const works = await listPublicWorks(repos);

    expect(works.map((work) => work.workId)).toEqual(["1"]);
    expect(works[0].price).toBe("10");
  });

  it("returns a single public work by id", async () => {
    const repos = await seedWorks();
    const work = await getPublicWork(repos, 2n);
    expect(work?.workId).toBe("2");
    expect(work?.active).toBe(false);
  });

  it("returns null for an unknown work", async () => {
    const repos = await seedWorks();
    expect(await getPublicWork(repos, 99n)).toBeNull();
  });
});
