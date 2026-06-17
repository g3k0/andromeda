import { InvalidContentKeyError } from "./errors";

/** ACE (Andromeda Content Encryption) specification constants — version 1. */

export const ACE_VERSION = "1" as const;

export const ACE_CONTENT_CIPHER = "aes-256-gcm" as const;

export const ACE_ENVELOPE_SCHEME = "ecies-secp256k1" as const;

export const ACE_TBA_STANDARD = "erc-6551" as const;

/** First byte of versioned ciphertext blobs. */
export const ACE_CIPHERTEXT_FORMAT_VERSION = 1;

/** First byte of versioned envelope blobs. */
export const ACE_ENVELOPE_FORMAT_VERSION = 1;

export const CONTENT_KEY_LENGTH = 32;

export const AES_GCM_IV_LENGTH = 12;

export const AES_GCM_TAG_LENGTH = 16;

export function generateContentKey(): Uint8Array {
  const key = new Uint8Array(CONTENT_KEY_LENGTH);
  crypto.getRandomValues(key);
  return key;
}

export function assertContentKeyLength(key: Uint8Array): asserts key is Uint8Array {
  if (key.length !== CONTENT_KEY_LENGTH) {
    throw new InvalidContentKeyError(
      `Content key must be ${CONTENT_KEY_LENGTH} bytes, got ${key.length}`,
    );
  }
}
