import type { ContentUri } from "@/lib/ipfs/content-uri";
import type { AcePublicMetadata, WorkImprintMetadata } from "@/lib/ipfs/metadata-schema";
import type { UploadResult } from "@/lib/ipfs/ports/permanent-storage-port";

export type WorkAttribute = {
  trait_type: string;
  value: string | number;
};

export type PublishWorkInput = {
  /** Pre-encrypted work content — the symmetric key never reaches the server. */
  ciphertext: Uint8Array;
  coverImage: Uint8Array;
  name: string;
  workImprint: WorkImprintMetadata;
  chainId: number;
  contractAddress: `0x${string}`;
  registryAddress: `0x${string}`;
  externalUrl?: string;
  attributes?: readonly WorkAttribute[];
};

export type PublishWorkResult = {
  coverUpload: UploadResult;
  contentUpload: UploadResult;
  metadataUpload: UploadResult;
  metadata: AcePublicMetadata;
  metadataUri: ContentUri;
};

export type BuildAceMetadataInput = {
  name: string;
  workImprint: WorkImprintMetadata;
  imageUri: ContentUri;
  encryptedContentUri: ContentUri;
  chainId: number;
  contractAddress: `0x${string}`;
  registryAddress: `0x${string}`;
  externalUrl?: string;
  attributes?: readonly WorkAttribute[];
};

export type RegisterWorkParams = {
  metadataUri: string;
  priceWei: bigint;
  maxCopies: bigint;
};

export type StoredWorkContentKey = {
  metadataUri: string;
  contentKeyBase64: string;
  storedAt: string;
};

/** Off-chain projection of an on-chain work (catalog/library UX, not authorization). */
export type WorkRecord = {
  workId: bigint;
  author: `0x${string}`;
  metadataURI: string;
  encryptedContentCid: string | null;
  price: bigint;
  maxCopies: bigint;
  minted: bigint;
  primarySaleRemaining: bigint;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UpsertWorkInput = {
  workId: bigint;
  author: string;
  metadataURI: string;
  price: bigint;
  maxCopies: bigint;
  active?: boolean;
  encryptedContentCid?: string | null;
};

/** Off-chain projection of a minted copy (ERC-721 token). */
export type TokenRecord = {
  tokenId: bigint;
  workId: bigint;
  owner: `0x${string}`;
  copyNumber: number | null;
  tbaAddress: `0x${string}` | null;
  envelopeCid: string | null;
  /** Base64-encoded secp256k1 public key for ACE envelope wrapping. */
  envelopeRecipientPublicKey: string | null;
  /** IPFS URI of the token's numbered metadata, once its `tokenURI` is set. */
  metadataURI: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpsertTokenInput = {
  tokenId: bigint;
  workId: bigint;
  owner: string;
  copyNumber?: number | null;
  tbaAddress?: string | null;
  envelopeCid?: string | null;
  envelopeRecipientPublicKey?: string | null;
  metadataURI?: string | null;
};

export type PendingTokenEnvelope = {
  tokenId: bigint;
  workId: bigint;
  metadataURI: string;
  recipientPublicKeyBase64: string;
};

export const WORK_UPLOAD_STATUSES = ["uploaded", "registered"] as const;
export type WorkUploadStatus = (typeof WORK_UPLOAD_STATUSES)[number];

/** Off-chain record of a work upload (IPFS metadata pinned by the author). */
export type WorkUploadRecord = {
  id: string;
  author: `0x${string}`;
  name: string;
  metadataURI: string;
  metadataCid: string;
  contentCid: string;
  coverCid: string;
  externalUrl: string | null;
  workImprint: WorkImprintMetadata;
  status: WorkUploadStatus;
  workId: string | null;
  registeredAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateWorkUploadInput = {
  author: string;
  name: string;
  metadataURI: string;
  metadataCid: string;
  contentCid: string;
  coverCid: string;
  externalUrl?: string;
  workImprint: WorkImprintMetadata;
};

export type WorkUploadMutationResult = PublishWorkResult & {
  upload: WorkUploadRecord;
};
