import type { SignedWalletPayload } from "@/lib/auth/client-wallet-auth";
import {
  ApiClientError,
  parseApiErrorBody,
} from "@/lib/i18n/api-error-messages";

import { recipientPublicKeyBase64FromBytes } from "./envelope-public-key";
import type { PendingTokenEnvelope } from "./types";

export async function registerTokenEnvelopeRecipient(
  tokenId: bigint,
  recipientPublicKey: Uint8Array,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await fetchImpl(
    `/api/works/tokens/${tokenId.toString()}/envelope-recipient`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientPublicKey: recipientPublicKeyBase64FromBytes(recipientPublicKey),
      }),
    },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as unknown;
    const parsed = parseApiErrorBody(body);
    if (parsed) {
      throw new ApiClientError(parsed.code, parsed.params);
    }
    throw new ApiClientError("unexpected");
  }
}

export async function uploadTokenEnvelopeForAuthor(
  tokenId: bigint,
  envelope: Uint8Array,
  walletAuth: SignedWalletPayload,
  fetchImpl: typeof fetch = fetch,
): Promise<{ envelopeCid: string }> {
  const formData = new FormData();
  formData.set("walletAuth", JSON.stringify(walletAuth));
  formData.set(
    "envelope",
    new Blob([Uint8Array.from(envelope)], { type: "application/octet-stream" }),
  );

  const response = await fetchImpl(
    `/api/works/tokens/${tokenId.toString()}/envelope`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as unknown;
    const parsed = parseApiErrorBody(body);
    if (parsed) {
      throw new ApiClientError(parsed.code, parsed.params);
    }
    throw new ApiClientError("unexpected");
  }

  return (await response.json()) as { envelopeCid: string };
}

export async function fetchPendingEnvelopesForAuthor(
  authorAddress: string,
  fetchImpl: typeof fetch = fetch,
): Promise<PendingTokenEnvelope[]> {
  const response = await fetchImpl(
    `/api/authors/${authorAddress}/pending-envelopes`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as unknown;
    const parsed = parseApiErrorBody(body);
    if (parsed) {
      throw new ApiClientError(parsed.code, parsed.params);
    }
    throw new ApiClientError("unexpected");
  }

  const json = (await response.json()) as Array<{
    tokenId: string;
    workId: string;
    metadataURI: string;
    recipientPublicKeyBase64: string;
  }>;

  return json.map((entry) => ({
    tokenId: BigInt(entry.tokenId),
    workId: BigInt(entry.workId),
    metadataURI: entry.metadataURI,
    recipientPublicKeyBase64: entry.recipientPublicKeyBase64,
  }));
}
