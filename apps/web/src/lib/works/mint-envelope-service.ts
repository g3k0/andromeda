import { wrapContentKey } from "@/lib/content-crypto/envelope";
import type { ContentKey, Envelope } from "@/lib/content-crypto/types";
import type { ContentUri } from "@/lib/ipfs/content-uri";
import { parseContentLocator } from "@/lib/ipfs/content-uri";
import type { PermanentStoragePort } from "@/lib/ipfs/ports/permanent-storage-port";

import { MintEnvelopeError } from "./errors";

export type CreateTokenEnvelopeInput = {
  /** ERC-721 token id of the minted copy. */
  tokenId: bigint;
  /** Symmetric content key `K` recovered locally — never persisted server-side. */
  contentKey: ContentKey;
  /** secp256k1 public key of the token's TBA identity (ECIES recipient). */
  recipientPublicKey: Uint8Array;
};

export type CreateTokenEnvelopeResult = {
  tokenId: bigint;
  /** Opaque storage id (CID or Arweave tx id). */
  envelopeCid: string;
  envelopeUri: ContentUri;
  /** True when an existing envelope was reused instead of uploading a new one. */
  reused: boolean;
};

/** Deterministic upload name so a token's envelope is easy to locate per `tokenId`. */
export function tokenEnvelopePinName(tokenId: bigint): string {
  return `token-${tokenId.toString()}-envelope`;
}

/**
 * Wraps `K` for the token's TBA public key and uploads the envelope to permanent storage.
 * The plaintext key is only handled transiently in the caller's runtime.
 */
export async function createTokenEnvelope(
  storage: PermanentStoragePort,
  input: CreateTokenEnvelopeInput,
): Promise<CreateTokenEnvelopeResult> {
  if (input.tokenId < 0n) {
    throw new MintEnvelopeError("tokenId must be a non-negative integer");
  }

  let envelope: Envelope;
  try {
    envelope = wrapContentKey(input.contentKey, input.recipientPublicKey);
  } catch (error) {
    throw new MintEnvelopeError(
      error instanceof Error ? error.message : "Failed to wrap content key",
    );
  }

  const uploaded = await storage.uploadBlob(envelope, {
    name: tokenEnvelopePinName(input.tokenId),
  });

  return {
    tokenId: input.tokenId,
    envelopeCid: uploaded.id,
    envelopeUri: uploaded.uri,
    reused: false,
  };
}

/** Builds a reused result from an already-uploaded envelope URI (no new upload). */
export function reuseTokenEnvelope(
  tokenId: bigint,
  envelopeUri: ContentUri,
): CreateTokenEnvelopeResult {
  return {
    tokenId,
    envelopeCid: parseContentLocator(envelopeUri).id,
    envelopeUri,
    reused: true,
  };
}

export type ProvisionTokenEnvelopeInput = CreateTokenEnvelopeInput & {
  /** When set, the token already has an envelope and uploading is skipped. */
  existingEnvelopeUri?: ContentUri | null;
};

/**
 * Idempotent envelope provisioning: reuses an existing envelope for the token
 * when present, otherwise wraps `K` and uploads a fresh one.
 */
export async function provisionTokenEnvelope(
  storage: PermanentStoragePort,
  input: ProvisionTokenEnvelopeInput,
): Promise<CreateTokenEnvelopeResult> {
  if (input.existingEnvelopeUri) {
    return reuseTokenEnvelope(input.tokenId, input.existingEnvelopeUri);
  }

  return createTokenEnvelope(storage, input);
}
