import { decryptWorkContent } from "@/lib/content-crypto/decrypt-workflow";
import type { TbaEnvelopeSigner } from "@/lib/content-crypto/tba-envelope-signer";
import { toGatewayUrl } from "@/lib/ipfs/gateway-url";
import { parseAcePublicMetadata } from "@/lib/ipfs/metadata-schema";

export type FetchBytes = (url: string) => Promise<Uint8Array>;
export type FetchJson = (url: string) => Promise<unknown>;

export type ReadWorkContentInput = {
  /** Gateway URL of the public metadata JSON. */
  metadataUrl: string;
  /** Gateway URL of the per-token ACE envelope wrapping `K`. */
  envelopeUrl: string;
  /** Gateway base used to resolve the ciphertext `ipfs://` URI from metadata. */
  gatewayBaseUrl: string;
  tbaSigner: TbaEnvelopeSigner;
  fetchJson: FetchJson;
  fetchBytes: FetchBytes;
};

/**
 * Fetches encrypted content + envelope from IPFS and decrypts it in the browser.
 * No server endpoint ever returns plaintext or the content key `K`.
 */
export async function readWorkContent(
  input: ReadWorkContentInput,
): Promise<Uint8Array> {
  const metadata = parseAcePublicMetadata(await input.fetchJson(input.metadataUrl));
  const ciphertextUrl = toGatewayUrl(
    metadata.ace.encrypted_content,
    input.gatewayBaseUrl,
  );

  const [ciphertext, envelope] = await Promise.all([
    input.fetchBytes(ciphertextUrl),
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
