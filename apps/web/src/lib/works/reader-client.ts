import { decryptWorkContent } from "@/lib/content-crypto/decrypt-workflow";
import type { TbaEnvelopeSigner } from "@/lib/content-crypto/tba-envelope-signer";
import type { ContentGatewayBases } from "@/lib/ipfs/gateway-url";
import { parseAcePublicMetadata } from "@/lib/ipfs/metadata-schema";

export type FetchBytes = (uriOrUrl: string) => Promise<Uint8Array>;
export type FetchJson = (uriOrUrl: string) => Promise<unknown>;

export type ReadWorkContentInput = {
  /**
   * Content URI (`ar://` / `ipfs://`) or already-resolved gateway HTTPS URL for
   * the public metadata JSON.
   */
  metadataUrl: string;
  /**
   * Content URI or gateway HTTPS URL of the per-token ACE envelope wrapping `K`.
   */
  envelopeUrl: string;
  /** Gateways used to resolve ciphertext `ar://` / legacy `ipfs://` URIs. */
  contentGateways: ContentGatewayBases;
  tbaSigner: TbaEnvelopeSigner;
  fetchJson: FetchJson;
  fetchBytes: FetchBytes;
};

/**
 * Fetches encrypted content + envelope from permanent storage and decrypts in the browser.
 * No server endpoint ever returns plaintext or the content key `K`.
 */
export async function readWorkContent(
  input: ReadWorkContentInput,
): Promise<Uint8Array> {
  const metadata = parseAcePublicMetadata(await input.fetchJson(input.metadataUrl));

  const [ciphertext, envelope] = await Promise.all([
    input.fetchBytes(metadata.ace.encrypted_content),
    input.fetchBytes(input.envelopeUrl),
  ]);

  return decryptWorkContent({
    ciphertext,
    envelope,
    tbaSigner: input.tbaSigner,
  });
}

export function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}
