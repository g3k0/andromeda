import { PrivateKey } from "eciesjs";
import { hexToBytes, keccak256 } from "viem";

import { unwrapContentKey } from "@/lib/content-crypto/envelope";
import type { TbaEnvelopeSigner } from "@/lib/content-crypto/tba-envelope-signer";

/**
 * Message the reader signs to derive their deterministic ACE reading keypair.
 * The envelope for a copy must be wrapped to the public key derived from the
 * same signature so the owner (and only the owner) can unwrap `K`.
 */
export const READER_KEY_SIGNATURE_MESSAGE = "Andromeda reader key v1";

export type ReaderKeypair = {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
};

function toUint8Array(bytes: Uint8Array | Buffer): Uint8Array {
  return bytes instanceof Uint8Array && bytes.constructor === Uint8Array
    ? bytes
    : new Uint8Array(bytes);
}

/** Derives a deterministic secp256k1 keypair from a wallet signature. */
export function deriveReaderKeypairFromSignature(
  signature: `0x${string}`,
): ReaderKeypair {
  const secret = hexToBytes(keccak256(signature));
  const privateKey = new PrivateKey(secret);

  return {
    privateKey: toUint8Array(privateKey.secret),
    publicKey: toUint8Array(privateKey.publicKey.toBytes()),
  };
}

/** Builds an envelope signer from a wallet signature, for in-browser unwrap. */
export function createReaderSignerFromSignature(
  signature: `0x${string}`,
): TbaEnvelopeSigner {
  const { privateKey } = deriveReaderKeypairFromSignature(signature);
  return {
    async unwrapEnvelope(envelope) {
      return unwrapContentKey(envelope, privateKey);
    },
  };
}
