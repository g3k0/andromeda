import type { ContentKey, Envelope } from "./types";

/** Abstraction for a TBA identity that can unwrap ACE envelopes. */
export type TbaEnvelopeSigner = {
  unwrapEnvelope(envelope: Envelope): Promise<ContentKey>;
};
