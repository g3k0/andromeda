import type { IpfsStoragePort } from "@/lib/ipfs/ports/ipfs-storage-port";
import type { IpfsUri } from "@/lib/ipfs/types";

import { loadWorkContentKey } from "./content-key-session";
import { WorkMintError } from "./errors";
import {
  createTokenEnvelope,
  reuseTokenEnvelope,
  type CreateTokenEnvelopeResult,
} from "./mint-envelope-service";

export type ResolveRecipientPublicKey = (params: {
  tokenId: bigint;
}) => Promise<Uint8Array> | Uint8Array;

export type CreateMintEnvelopeFromSessionInput = {
  /** Work `metadataURI` used to look up the locally-held content key. */
  metadataUri: string;
  tokenId: bigint;
  /** Resolves the token's TBA secp256k1 public key (ECIES recipient). */
  resolveRecipientPublicKey: ResolveRecipientPublicKey;
  /** When the token already has an envelope, reuse it instead of re-pinning. */
  existingEnvelopeUri?: IpfsUri | null;
};

export type MintEnvelopeClientDeps = {
  ipfs: IpfsStoragePort;
  /** Overridable for tests; defaults to the session-storage backed loader. */
  loadContentKey?: (metadataUri: string) => Uint8Array | null;
};

/**
 * Author-side orchestration (ACE strategy v1): recover `K` from the author's
 * local session, wrap it for the freshly minted token's TBA, and pin the
 * envelope. Idempotent when an existing envelope URI is provided.
 */
export async function createMintEnvelopeFromSession(
  deps: MintEnvelopeClientDeps,
  input: CreateMintEnvelopeFromSessionInput,
): Promise<CreateTokenEnvelopeResult> {
  if (input.existingEnvelopeUri) {
    return reuseTokenEnvelope(input.tokenId, input.existingEnvelopeUri);
  }

  const load = deps.loadContentKey ?? loadWorkContentKey;
  const contentKey = load(input.metadataUri);
  if (!contentKey) {
    throw new WorkMintError(
      "Author content key is unavailable; reconnect the author session to mint envelopes.",
    );
  }

  const recipientPublicKey = await input.resolveRecipientPublicKey({
    tokenId: input.tokenId,
  });

  return createTokenEnvelope(deps.ipfs, {
    tokenId: input.tokenId,
    contentKey,
    recipientPublicKey,
  });
}
