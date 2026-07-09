import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";
import type { IpfsStoragePort } from "@/lib/ipfs/ports/ipfs-storage-port";
import { parseIpfsUri, type Cid, type IpfsUri } from "@/lib/ipfs/types";

import { buildTokenMetadata } from "./token-metadata";

/** Deterministic pin name so a token's metadata is easy to locate per `tokenId`. */
export function tokenMetadataPinName(tokenId: bigint): string {
  return `token-${tokenId.toString()}-metadata`;
}

export type ProvisionTokenMetadataInput = {
  tokenId: bigint;
  /** Public ACE metadata of the parent work (shared ciphertext/envelope block). */
  workMetadata: AcePublicMetadata;
  copyNumber: number;
  maxCopies: bigint;
  /** When set, the token already has numbered metadata and pinning is skipped. */
  existingMetadataUri?: IpfsUri | null;
};

export type ProvisionTokenMetadataResult = {
  tokenId: bigint;
  metadataCid: Cid;
  metadataUri: IpfsUri;
  /** The pinned document, or `null` when an existing URI was reused. */
  metadata: AcePublicMetadata | null;
  /** True when an existing metadata URI was reused instead of pinning a new one. */
  reused: boolean;
};

/**
 * Idempotent per-token metadata provisioning: reuses an existing metadata URI
 * for the token when present, otherwise derives the numbered document and pins
 * it on IPFS. The ACE encryption block is copied verbatim from the work.
 */
export async function provisionTokenMetadata(
  ipfs: IpfsStoragePort,
  input: ProvisionTokenMetadataInput,
): Promise<ProvisionTokenMetadataResult> {
  if (input.existingMetadataUri) {
    return {
      tokenId: input.tokenId,
      metadataCid: parseIpfsUri(input.existingMetadataUri),
      metadataUri: input.existingMetadataUri,
      metadata: null,
      reused: true,
    };
  }

  const metadata = buildTokenMetadata({
    workMetadata: input.workMetadata,
    copyNumber: input.copyNumber,
    maxCopies: input.maxCopies,
  });

  const pin = await ipfs.pinJson(metadata, {
    name: tokenMetadataPinName(input.tokenId),
  });

  return {
    tokenId: input.tokenId,
    metadataCid: pin.cid,
    metadataUri: pin.uri,
    metadata,
    reused: false,
  };
}
