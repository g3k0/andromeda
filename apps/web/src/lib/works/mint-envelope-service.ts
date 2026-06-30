import { wrapContentKey } from "@/lib/content-crypto/envelope";
import type { ContentKey, Envelope } from "@/lib/content-crypto/types";
import type { IpfsStoragePort } from "@/lib/ipfs/ports/ipfs-storage-port";
import type { Cid, IpfsUri } from "@/lib/ipfs/types";

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
  envelopeCid: Cid;
  envelopeUri: IpfsUri;
  /** True when an existing envelope was reused instead of pinning a new one. */
  reused: boolean;
};

/** Deterministic pin name so a token's envelope is easy to locate per `tokenId`. */
export function tokenEnvelopePinName(tokenId: bigint): string {
  return `token-${tokenId.toString()}-envelope`;
}

/**
 * Wraps `K` for the token's TBA public key and pins the resulting envelope on IPFS.
 * The plaintext key is only handled transiently in the caller's runtime.
 */
export async function createTokenEnvelope(
  ipfs: IpfsStoragePort,
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

  const pin = await ipfs.pinBlob(envelope, {
    name: tokenEnvelopePinName(input.tokenId),
  });

  return {
    tokenId: input.tokenId,
    envelopeCid: pin.cid,
    envelopeUri: pin.uri,
    reused: false,
  };
}
