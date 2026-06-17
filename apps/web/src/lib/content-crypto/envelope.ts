import { decrypt, encrypt } from "eciesjs";

import {
  ACE_ENVELOPE_FORMAT_VERSION,
  assertContentKeyLength,
} from "./ace-spec";
import {
  EnvelopeUnwrapError,
  InvalidContentKeyError,
  InvalidEnvelopeError,
} from "./errors";
import type { ContentKey, Envelope } from "./types";

const MIN_ECIES_PAYLOAD_LENGTH = 33;

function parseEnvelopeLayout(envelope: Envelope): Uint8Array {
  if (envelope.length < 1 + MIN_ECIES_PAYLOAD_LENGTH) {
    throw new InvalidEnvelopeError("Envelope is too short");
  }

  if (envelope[0] !== ACE_ENVELOPE_FORMAT_VERSION) {
    throw new InvalidEnvelopeError("Unsupported envelope format version");
  }

  return envelope.subarray(1);
}

function toUint8Array(bytes: Uint8Array | Buffer): Uint8Array {
  return new Uint8Array(bytes);
}

export function wrapContentKey(
  contentKey: ContentKey,
  recipientPublicKey: Uint8Array,
): Envelope {
  try {
    assertContentKeyLength(contentKey);
  } catch (error) {
    if (error instanceof InvalidContentKeyError) {
      throw error;
    }
    throw new InvalidContentKeyError();
  }

  const eciesPayload = encrypt(
    recipientPublicKey,
    toUint8Array(contentKey),
  );
  const payload =
    eciesPayload instanceof Uint8Array
      ? eciesPayload
      : new Uint8Array(eciesPayload);

  const envelope = new Uint8Array(1 + payload.length);
  envelope[0] = ACE_ENVELOPE_FORMAT_VERSION;
  envelope.set(payload, 1);

  return envelope;
}

export function unwrapContentKey(
  envelope: Envelope,
  recipientPrivateKey: Uint8Array,
): ContentKey {
  let eciesPayload: Uint8Array;

  try {
    eciesPayload = parseEnvelopeLayout(envelope);
  } catch (error) {
    if (error instanceof InvalidEnvelopeError) {
      throw error;
    }
    throw new InvalidEnvelopeError();
  }

  try {
    const contentKey = decrypt(recipientPrivateKey, toUint8Array(eciesPayload));
    const keyBytes = toUint8Array(
      contentKey instanceof Uint8Array
        ? contentKey
        : new Uint8Array(contentKey),
    );
    assertContentKeyLength(keyBytes);
    return keyBytes;
  } catch (error) {
    if (error instanceof InvalidContentKeyError) {
      throw error;
    }
    throw new EnvelopeUnwrapError();
  }
}
