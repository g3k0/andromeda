import { describe, expect, it } from "vitest";

import {
  computeBlockRanges,
  resolveLastProcessedBlock,
} from "./sync-cursor";

describe("resolveLastProcessedBlock", () => {
  it("skips empty history on first run when start block is set", () => {
    expect(resolveLastProcessedBlock(0n, 100n)).toBe(99n);
  });

  it("keeps the cursor once indexing has started", () => {
    expect(resolveLastProcessedBlock(500n, 100n)).toBe(500n);
  });

  it("ignores a zero or missing start block", () => {
    expect(resolveLastProcessedBlock(0n)).toBe(0n);
    expect(resolveLastProcessedBlock(0n, 0n)).toBe(0n);
  });
});

describe("computeBlockRanges", () => {
  it("returns an empty list when there is nothing new", () => {
    expect(computeBlockRanges(100n, 100n, 10n)).toEqual([]);
    expect(computeBlockRanges(100n, 90n, 10n)).toEqual([]);
  });

  it("returns a single range within the cap", () => {
    expect(computeBlockRanges(0n, 5n, 100n)).toEqual([
      { fromBlock: 1n, toBlock: 5n },
    ]);
  });

  it("splits large intervals into capped ranges", () => {
    expect(computeBlockRanges(0n, 25n, 10n)).toEqual([
      { fromBlock: 1n, toBlock: 10n },
      { fromBlock: 11n, toBlock: 20n },
      { fromBlock: 21n, toBlock: 25n },
    ]);
  });

  it("rejects a non-positive range size", () => {
    expect(() => computeBlockRanges(0n, 10n, 0n)).toThrow();
  });
});
