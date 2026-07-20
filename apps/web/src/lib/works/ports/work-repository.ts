import type {
  PendingTokenEnvelope,
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
  decrementPrimarySaleRemaining(workId: bigint): Promise<void>;
};

export type TokenRepository = {
  upsertToken(input: UpsertTokenInput): Promise<TokenRecord>;
  getToken(tokenId: bigint): Promise<TokenRecord | null>;
  listByOwner(owner: string): Promise<TokenRecord[]>;
  /** Updates the owner only when the token exists; returns whether it changed. */
  setOwner(tokenId: bigint, owner: string): Promise<boolean>;
  /** Sets the token's numbered metadata URI; returns whether the token existed. */
  setMetadataURI(tokenId: bigint, metadataURI: string): Promise<boolean>;
  setEnvelopeRecipientPublicKey(
    tokenId: bigint,
    recipientPublicKeyBase64: string,
  ): Promise<boolean>;
  setEnvelopeCid(tokenId: bigint, envelopeCid: string): Promise<boolean>;
  listPendingEnvelopesByAuthor(author: string): Promise<PendingTokenEnvelope[]>;
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
