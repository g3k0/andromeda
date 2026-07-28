import { wrapContentKey } from "@/lib/content-crypto/envelope";

import {
  createSignedWalletPayload,
  type SignMessageFn,
  type SignedWalletPayload,
} from "@/lib/auth/client-wallet-auth";
import { loadWorkContentKey } from "./content-key-session";
import { recipientPublicKeyBytesFromBase64 } from "./envelope-public-key";
import { WorkMintError } from "./errors";
import {
  fetchPendingEnvelopesForAuthor,
  uploadTokenEnvelopeForAuthor,
} from "./mint-envelope-api-client";
import type { PendingTokenEnvelope } from "./types";

export function createTokenEnvelopeBlobFromSession(
  metadataUri: string,
  recipientPublicKeyBase64: string,
): Uint8Array {
  const contentKey = loadWorkContentKey(metadataUri);
  if (!contentKey) {
    throw new WorkMintError(
      "Author content key is unavailable; reconnect the author session to mint envelopes.",
    );
  }

  return wrapContentKey(
    contentKey,
    recipientPublicKeyBytesFromBase64(recipientPublicKeyBase64),
  );
}

export async function provisionPendingEnvelopeForAuthor(
  pending: PendingTokenEnvelope,
  walletAuth: SignedWalletPayload,
): Promise<{ tokenId: bigint; envelopeUri: string }> {
  const envelope = createTokenEnvelopeBlobFromSession(
    pending.metadataURI,
    pending.recipientPublicKeyBase64,
  );
  const result = await uploadTokenEnvelopeForAuthor(
    pending.tokenId,
    envelope,
    walletAuth,
  );
  return {
    tokenId: pending.tokenId,
    envelopeUri: result.envelopeUri,
  };
}

export async function provisionAllPendingEnvelopesForAuthor(input: {
  authorAddress: string;
  address: `0x${string}`;
  signMessageAsync: SignMessageFn;
}): Promise<Array<{ tokenId: bigint; envelopeUri: string }>> {
  const pending = await fetchPendingEnvelopesForAuthor(input.authorAddress);
  const ready = pending.filter((entry) => loadWorkContentKey(entry.metadataURI));
  if (ready.length === 0) {
    return [];
  }

  const walletAuth = await createSignedWalletPayload(
    input.address,
    input.signMessageAsync,
  );

  return Promise.all(
    ready.map((entry) =>
      provisionPendingEnvelopeForAuthor(entry, walletAuth),
    ),
  );
}

export function canProvisionEnvelopeForMetadata(metadataUri: string): boolean {
  return loadWorkContentKey(metadataUri) !== null;
}
