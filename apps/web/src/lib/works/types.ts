import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";
import type { IpfsUri, PinResult } from "@/lib/ipfs/types";

export type WorkAttribute = {
  trait_type: string;
  value: string | number;
};

export type PublishWorkInput = {
  /** Pre-encrypted work content — the symmetric key never reaches the server. */
  ciphertext: Uint8Array;
  coverImage: Uint8Array;
  name: string;
  description: string;
  chainId: number;
  contractAddress: `0x${string}`;
  registryAddress: `0x${string}`;
  externalUrl?: string;
  attributes?: readonly WorkAttribute[];
};

export type PublishWorkResult = {
  coverPin: PinResult;
  contentPin: PinResult;
  metadataPin: PinResult;
  metadata: AcePublicMetadata;
  metadataUri: IpfsUri;
};

export type BuildAceMetadataInput = {
  name: string;
  description: string;
  imageUri: IpfsUri;
  encryptedContentUri: IpfsUri;
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
