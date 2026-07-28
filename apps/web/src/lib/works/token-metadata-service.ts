import type { ContentUri } from "@/lib/ipfs/content-uri";
import { parseContentLocator } from "@/lib/ipfs/content-uri";
import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";
import type { PermanentStoragePort } from "@/lib/ipfs/ports/permanent-storage-port";

import { buildTokenMetadata } from "./token-metadata";

/** Deterministic upload name so a token's metadata is easy to locate per `tokenId`. */
export function tokenMetadataPinName(tokenId: bigint): string {
  return `token-${tokenId.toString()}-metadata`;
}

export type ProvisionTokenMetadataInput = {
  tokenId: bigint;
  /** Public ACE metadata of the parent work (shared ciphertext/envelope block). */
  workMetadata: AcePublicMetadata;
  copyNumber: number;
  maxCopies: bigint;
  /** When set, the token already has numbered metadata and uploading is skipped. */
  existingMetadataUri?: ContentUri | null;
};

export type ProvisionTokenMetadataResult = {
  tokenId: bigint;
  /** Opaque storage id (CID or Arweave tx id). */
  metadataCid: string;
  metadataUri: ContentUri;
  /** The uploaded document, or `null` when an existing URI was reused. */
  metadata: AcePublicMetadata | null;
  /** True when an existing metadata URI was reused instead of uploading a new one. */
  reused: boolean;
};

/**
 * Idempotent per-token metadata provisioning: reuses an existing metadata URI
 * for the token when present, otherwise derives the numbered document and
 * uploads it to permanent storage. The ACE encryption block is copied verbatim.
 */
export async function provisionTokenMetadata(
  storage: PermanentStoragePort,
  input: ProvisionTokenMetadataInput,
): Promise<ProvisionTokenMetadataResult> {
  if (input.existingMetadataUri) {
    return {
      tokenId: input.tokenId,
      metadataCid: parseContentLocator(input.existingMetadataUri).id,
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

  const uploaded = await storage.uploadJson(metadata, {
    name: tokenMetadataPinName(input.tokenId),
  });

  return {
    tokenId: input.tokenId,
    metadataCid: uploaded.id,
    metadataUri: uploaded.uri,
    metadata,
    reused: false,
  };
}
