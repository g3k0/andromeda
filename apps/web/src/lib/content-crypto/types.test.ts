import { describe, expect, it } from "vitest";

import type { AceMetadataBlock, Ciphertext, ContentKey, Envelope } from "./types";

describe("ACE domain types", () => {
  it("accepts metadata block shape aligned with the plan", () => {
    const metadata: AceMetadataBlock = {
      version: "1",
      encrypted_content: "ipfs://bafyciphertext",
      cipher: "aes-256-gcm",
      envelope_scheme: "ecies-secp256k1",
      tba_standard: "erc-6551",
      chain_id: 80002,
      contract: "0xabcdef0123456789abcdef0123456789abcdef01",
      registry: "0x1234567890abcdef1234567890abcdef12345678",
    };

    expect(metadata.version).toBe("1");
    expect(metadata.cipher).toBe("aes-256-gcm");
  });

  it("accepts binary key and blob types", () => {
    const key: ContentKey = new Uint8Array(32);
    const ciphertext: Ciphertext = new Uint8Array([1, 2, 3]);
    const envelope: Envelope = new Uint8Array([4, 5, 6]);

    expect(key.byteLength).toBe(32);
    expect(ciphertext[0]).toBe(1);
    expect(envelope[2]).toBe(6);
  });
});
