import type { Address } from "viem";

import { createSignedWalletPayload } from "@/lib/auth/client-wallet-auth";

import { recipientPublicKeyBase64FromBytes } from "./envelope-public-key";
import {
  canProvisionEnvelopeForMetadata,
  createTokenEnvelopeBlobFromSession,
} from "./mint-envelope-author-client";
import {
  registerTokenEnvelopeRecipient,
  uploadTokenEnvelopeForAuthor,
} from "./mint-envelope-api-client";
import {
  deriveReaderPublicKeyFromSignature,
  READER_KEY_SIGNATURE_MESSAGE,
} from "./reader-signer";

export type CompleteMintEnvelopeInput = {
  tokenId: bigint;
  metadataUri: string;
  signMessageAsync: (args: { message: string }) => Promise<`0x${string}`>;
  authorAddress?: Address | null;
  signAuthorMessageAsync?: (args: { message: string }) => Promise<`0x${string}`>;
};

export type CompleteMintEnvelopeResult = {
  envelopeCid: string | null;
  awaitingAuthor: boolean;
};

export async function completeMintEnvelopeSetup(
  input: CompleteMintEnvelopeInput,
): Promise<CompleteMintEnvelopeResult> {
  const readerSignature = await input.signMessageAsync({
    message: READER_KEY_SIGNATURE_MESSAGE,
  });
  const recipientPublicKey = deriveReaderPublicKeyFromSignature(readerSignature);

  await registerTokenEnvelopeRecipient(input.tokenId, recipientPublicKey);

  const canAuthorProvision =
    input.authorAddress &&
    input.signAuthorMessageAsync &&
    canProvisionEnvelopeForMetadata(input.metadataUri);

  if (!canAuthorProvision || !input.signAuthorMessageAsync || !input.authorAddress) {
    return { envelopeCid: null, awaitingAuthor: true };
  }

  const walletAuth = await createSignedWalletPayload(
    input.authorAddress,
    input.signAuthorMessageAsync,
  );
  const envelope = createTokenEnvelopeBlobFromSession(
    input.metadataUri,
    recipientPublicKeyBase64FromBytes(recipientPublicKey),
  );
  const uploaded = await uploadTokenEnvelopeForAuthor(
    input.tokenId,
    envelope,
    walletAuth,
  );

  return {
    envelopeCid: uploaded.envelopeCid,
    awaitingAuthor: false,
  };
}
