import { MintEnvelopeError } from "./errors";

const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

function decodeBase64(value: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64"));
  }
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

function encodeBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/** Validates and normalizes a base64-encoded secp256k1 public key. */
export function parseRecipientPublicKeyBase64(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || !BASE64_PATTERN.test(trimmed)) {
    throw new MintEnvelopeError("Invalid envelope recipient public key.");
  }

  let bytes: Uint8Array;
  try {
    bytes = decodeBase64(trimmed);
  } catch {
    throw new MintEnvelopeError("Invalid envelope recipient public key.");
  }

  if (bytes.length !== 33 && bytes.length !== 65) {
    throw new MintEnvelopeError("Invalid envelope recipient public key length.");
  }

  return trimmed;
}

export function recipientPublicKeyBase64FromBytes(bytes: Uint8Array): string {
  return encodeBase64(bytes);
}

export function recipientPublicKeyBytesFromBase64(value: string): Uint8Array {
  const normalized = parseRecipientPublicKeyBase64(value);
  return decodeBase64(normalized);
}
