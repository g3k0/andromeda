import type { PermanentStoragePort } from "@/lib/ipfs/ports/permanent-storage-port";

import { assertSignerIsAuthor } from "./authorize";
import { parseRecipientPublicKeyBase64 } from "./envelope-public-key";
import {
  InvalidTokenIdParamError,
  InvalidWorkIdParamError,
  MintEnvelopeError,
  WorkMintError,
} from "./errors";
import { tokenEnvelopePinName } from "./mint-envelope-service";
import type { IndexerRepositories } from "./ports/work-repository";
import type { PendingTokenEnvelope } from "./types";

export function parseTokenIdParam(value: string): bigint {
  if (!/^\d+$/.test(value)) {
    throw new InvalidTokenIdParamError(value);
  }
  const tokenId = BigInt(value);
  if (tokenId <= 0n) {
    throw new InvalidTokenIdParamError(value);
  }
  return tokenId;
}

export async function registerTokenEnvelopeRecipient(
  repositories: IndexerRepositories,
  tokenId: bigint,
  recipientPublicKeyBase64: string,
): Promise<void> {
  const recipientPublicKey = parseRecipientPublicKeyBase64(recipientPublicKeyBase64);
  const token = await repositories.tokens.getToken(tokenId);
  if (!token) {
    throw new WorkMintError("Minted token was not found.");
  }
  if (token.envelopeCid) {
    return;
  }

  const updated = await repositories.tokens.setEnvelopeRecipientPublicKey(
    tokenId,
    recipientPublicKey,
  );
  if (!updated) {
    throw new WorkMintError("Minted token was not found.");
  }
}

export async function pinTokenEnvelopeForAuthor(
  repositories: IndexerRepositories,
  storage: PermanentStoragePort,
  signerAddress: string,
  tokenId: bigint,
  envelope: Uint8Array,
): Promise<{ envelopeCid: string; envelopeUri: string }> {
  if (envelope.length < 34) {
    throw new MintEnvelopeError("Invalid envelope payload.");
  }

  const token = await repositories.tokens.getToken(tokenId);
  if (!token) {
    throw new WorkMintError("Minted token was not found.");
  }
  if (token.envelopeCid) {
    return {
      envelopeCid: token.envelopeCid,
      envelopeUri: token.envelopeCid,
    };
  }
  if (!token.envelopeRecipientPublicKey) {
    throw new MintEnvelopeError(
      "Reader public key is missing for this token envelope.",
    );
  }

  const work = await repositories.works.getWork(token.workId);
  if (!work) {
    throw new WorkMintError("Work was not found for this token.");
  }

  assertSignerIsAuthor(signerAddress, work.author);

  const uploaded = await storage.uploadBlob(envelope, {
    name: tokenEnvelopePinName(tokenId),
  });

  // Persist the full content URI so the read path can resolve ar:// or ipfs://.
  const updated = await repositories.tokens.setEnvelopeCid(
    tokenId,
    uploaded.uri,
  );
  if (!updated) {
    throw new WorkMintError("Minted token was not found.");
  }

  return { envelopeCid: uploaded.uri, envelopeUri: uploaded.uri };
}

export async function listPendingTokenEnvelopesForAuthor(
  repositories: IndexerRepositories,
  authorAddress: string,
): Promise<PendingTokenEnvelope[]> {
  return repositories.tokens.listPendingEnvelopesByAuthor(authorAddress);
}

export function parseWorkIdParam(value: string): bigint {
  if (!/^\d+$/.test(value)) {
    throw new InvalidWorkIdParamError(value);
  }
  return BigInt(value);
}
