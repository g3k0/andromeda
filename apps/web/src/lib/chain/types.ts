export type WorkOnChain = {
  workId: bigint;
  author: `0x${string}`;
  metadataURI: string;
  /** Price per copy in wei. */
  price: bigint;
  /** Maximum copies; `0n` means unlimited (legacy). */
  maxCopies: bigint;
  /** Total copies minted (full edition size after publish). */
  minted: bigint;
  /** Copies still held by the author and available for primary sale. */
  primarySaleRemaining: bigint;
  active: boolean;
};

export type TokenOwner = {
  tokenId: bigint;
  owner: `0x${string}`;
};

/** Tuple returned by the `works(uint256)` Solidity getter. */
export type RawWorkTuple = readonly [
  author: `0x${string}`,
  metadataURI: string,
  price: bigint,
  maxCopies: bigint,
  minted: bigint,
  active: boolean,
];
