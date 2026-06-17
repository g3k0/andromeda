import { unwrapContentKey } from "../envelope";
import type { TbaEnvelopeSigner } from "../tba-envelope-signer";
import type { ContentKey, Envelope } from "../types";

export function createPrivateKeyTbaEnvelopeSigner(
  privateKey: Uint8Array,
): TbaEnvelopeSigner {
  return {
    async unwrapEnvelope(envelope: Envelope): Promise<ContentKey> {
      return unwrapContentKey(envelope, privateKey);
    },
  };
}
