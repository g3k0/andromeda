import { describe, expect, it } from "vitest";

import { generateContentKey } from "./ace-spec";
import {
  decodeUtf8Plaintext,
  decryptContent,
  encodeUtf8Plaintext,
  encryptContent,
} from "./content-cipher";
import { ContentDecryptError, InvalidCiphertextError } from "./errors";

describe("content cipher", () => {
  it("round-trips plaintext with AES-256-GCM", async () => {
    const key = generateContentKey();
    const plaintext = encodeUtf8Plaintext(
      "Andromeda ACE — encrypted literary work body.",
    );

    const ciphertext = await encryptContent(plaintext, key);
    const decrypted = await decryptContent(ciphertext, key);

    expect(decodeUtf8Plaintext(decrypted)).toBe(
      "Andromeda ACE — encrypted literary work body.",
    );
    expect(ciphertext[0]).toBe(1);
    expect(ciphertext.length).toBeGreaterThan(plaintext.length);
  });

  it("rejects tampered ciphertext (invalid GCM tag)", async () => {
    const key = generateContentKey();
    const ciphertext = await encryptContent(encodeUtf8Plaintext("secret"), key);
    const tampered = new Uint8Array(ciphertext);
    tampered[tampered.length - 1] ^= 0xff;

    await expect(decryptContent(tampered, key)).rejects.toThrow(
      ContentDecryptError,
    );
  });

  it("rejects unsupported ciphertext versions", async () => {
    const key = generateContentKey();
    const invalid = new Uint8Array([99, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

    await expect(decryptContent(invalid, key)).rejects.toThrow(
      InvalidCiphertextError,
    );
  });

  it("rejects wrong content key length before decrypt", async () => {
    const key = generateContentKey();
    const ciphertext = await encryptContent(encodeUtf8Plaintext("x"), key);

    await expect(decryptContent(ciphertext, new Uint8Array(16))).rejects.toThrow(
      /content key/i,
    );
  });
});
