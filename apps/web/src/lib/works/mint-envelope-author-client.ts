import { wrapContentKey } from "@/lib/content-crypto/envelope";

import { loadWorkContentKey } from "./content-key-session";
import { recipientPublicKeyBytesFromBase64 } from "./envelope-public-key";
import { WorkMintError } from "./errors";
import {
  fetchPendingEnvelopesForAuthor,
  uploadTokenEnvelopeForAuthor,
} from "./mint-envelope-api-client";
import type { PendingTokenEnvelope } from "./types";
import type { SignedWalletPayload } from "@/lib/auth/client-wallet-auth";

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
): Promise<string> {
  const envelope = createTokenEnvelopeBlobFromSession(
    pending.metadataURI,
    pending.recipientPublicKeyBase64,
  );
  const result = await uploadTokenEnvelopeForAuthor(
    pending.tokenId,
    envelope,
    walletAuth,
  );
  return result.envelopeCid;
}

export async function provisionAllPendingEnvelopesForAuthor(input: {
  authorAddress: string;
  walletAuth: SignedWalletPayload;
}): Promise<string[]> {
  const pending = await fetchPendingEnvelopesForAuthor(input.authorAddress);
  const ready = pending.filter((entry) => loadWorkContentKey(entry.metadataURI));

  return Promise.all(
    ready.map((entry) =>
      provisionPendingEnvelopeForAuthor(entry, input.walletAuth),
    ),
  );
}

export function canProvisionEnvelopeForMetadata(metadataUri: string): boolean {
  return loadWorkContentKey(metadataUri) !== null;
}
