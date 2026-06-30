export type BlockRange = {
  fromBlock: bigint;
  toBlock: bigint;
};

function bigintMin(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

/**
 * Resolves the effective last-processed block for the first run: when the cursor
 * is still at genesis (0) and a deployment start block is configured, we skip the
 * empty history before the contract existed.
 */
export function resolveLastProcessedBlock(
  cursor: bigint,
  startBlock?: bigint,
): bigint {
  if (cursor === 0n && startBlock !== undefined && startBlock > 0n) {
    return startBlock - 1n;
  }
  return cursor;
}

/**
 * Splits the [lastProcessedBlock + 1, latestBlock] interval into capped ranges
 * suitable for `getLogs`. Returns an empty list when there is nothing new.
 */
export function computeBlockRanges(
  lastProcessedBlock: bigint,
  latestBlock: bigint,
  maxRangeSize: bigint,
): BlockRange[] {
  if (maxRangeSize <= 0n) {
    throw new Error("maxRangeSize must be positive");
  }
  if (latestBlock <= lastProcessedBlock) {
    return [];
  }

  const ranges: BlockRange[] = [];
  let fromBlock = lastProcessedBlock + 1n;
  while (fromBlock <= latestBlock) {
    const toBlock = bigintMin(fromBlock + maxRangeSize - 1n, latestBlock);
    ranges.push({ fromBlock, toBlock });
    fromBlock = toBlock + 1n;
  }
  return ranges;
}
