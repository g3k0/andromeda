import { describe, expect, it } from "vitest";

import { createTbaKeyFixture } from "@/lib/content-crypto/testing/key-fixtures";

import {
  parseRecipientPublicKeyBase64,
  recipientPublicKeyBase64FromBytes,
  recipientPublicKeyBytesFromBase64,
} from "./envelope-public-key";
import { MintEnvelopeError } from "./errors";

describe("envelope-public-key", () => {
  it("round-trips a compressed secp256k1 public key", () => {
    const { publicKey } = createTbaKeyFixture();
    const encoded = recipientPublicKeyBase64FromBytes(publicKey);
    expect(recipientPublicKeyBytesFromBase64(encoded)).toEqual(publicKey);
  });

  it("rejects malformed base64 keys", () => {
    expect(() => parseRecipientPublicKeyBase64("not!!!base64")).toThrow(
      MintEnvelopeError,
    );
  });
});
