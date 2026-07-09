import { createHmac, timingSafeEqual } from "node:crypto";

/** HTTP header Alchemy Notify uses to carry the HMAC signature of the body. */
export const ALCHEMY_SIGNATURE_HEADER = "x-alchemy-signature";

/** Computes the hex HMAC-SHA256 of a raw request body with the signing key. */
export function computeAlchemySignature(
  rawBody: string,
  signingKey: string,
): string {
  return createHmac("sha256", signingKey).update(rawBody, "utf8").digest("hex");
}

/**
 * Verifies an Alchemy Notify webhook signature against the raw body.
 * Uses a constant-time comparison and rejects missing/malformed signatures.
 */
export function verifyAlchemySignature(
  rawBody: string,
  signature: string | null | undefined,
  signingKey: string,
): boolean {
  if (!signature || !signingKey) {
    return false;
  }

  const expected = computeAlchemySignature(rawBody, signingKey);
  const expectedBuffer = Buffer.from(expected, "hex");
  let providedBuffer: Buffer;
  try {
    providedBuffer = Buffer.from(signature.trim(), "hex");
  } catch {
    return false;
  }

  if (
    providedBuffer.length === 0 ||
    providedBuffer.length !== expectedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}
