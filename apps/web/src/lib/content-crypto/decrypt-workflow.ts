import { decryptContent } from "./content-cipher";
import type { Ciphertext, Envelope } from "./types";
import type { TbaEnvelopeSigner } from "./tba-envelope-signer";

export type DecryptWorkContentInput = {
  ciphertext: Ciphertext;
  envelope: Envelope;
  tbaSigner: TbaEnvelopeSigner;
};

export async function decryptWorkContent({
  ciphertext,
  envelope,
  tbaSigner,
}: DecryptWorkContentInput): Promise<Uint8Array> {
  const contentKey = await tbaSigner.unwrapEnvelope(envelope);
  return decryptContent(ciphertext, contentKey);
}
