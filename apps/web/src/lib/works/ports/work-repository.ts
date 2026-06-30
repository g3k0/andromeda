import type {
  TokenRecord,
  UpsertTokenInput,
  UpsertWorkInput,
  WorkRecord,
} from "../types";

export type WorkRepository = {
  upsertWork(input: UpsertWorkInput): Promise<WorkRecord>;
  getWork(workId: bigint): Promise<WorkRecord | null>;
  listWorks(): Promise<WorkRecord[]>;
  setActive(workId: bigint, active: boolean): Promise<void>;
  setMinted(workId: bigint, minted: bigint): Promise<void>;
};

export type TokenRepository = {
  upsertToken(input: UpsertTokenInput): Promise<TokenRecord>;
  getToken(tokenId: bigint): Promise<TokenRecord | null>;
  listByOwner(owner: string): Promise<TokenRecord[]>;
  /** Updates the owner only when the token exists; returns whether it changed. */
  setOwner(tokenId: bigint, owner: string): Promise<boolean>;
};

export type ChainSyncRepository = {
  getLastProcessedBlock(): Promise<bigint>;
  setLastProcessedBlock(block: bigint): Promise<void>;
};

export type IndexerRepositories = {
  works: WorkRepository;
  tokens: TokenRepository;
  chainSync: ChainSyncRepository;
};
