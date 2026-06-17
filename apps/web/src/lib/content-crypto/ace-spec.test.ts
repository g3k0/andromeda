import { describe, expect, it } from "vitest";

import {
  ACE_CONTENT_CIPHER,
  ACE_ENVELOPE_SCHEME,
  ACE_TBA_STANDARD,
  ACE_VERSION,
  assertContentKeyLength,
  CONTENT_KEY_LENGTH,
  generateContentKey,
} from "./ace-spec";
import { InvalidContentKeyError } from "./errors";

describe("ACE spec constants", () => {
  it("defines version 1 algorithms", () => {
    expect(ACE_VERSION).toBe("1");
    expect(ACE_CONTENT_CIPHER).toBe("aes-256-gcm");
    expect(ACE_ENVELOPE_SCHEME).toBe("ecies-secp256k1");
    expect(ACE_TBA_STANDARD).toBe("erc-6551");
  });

  it("generates 32-byte content keys", () => {
    const key = generateContentKey();
    expect(key).toHaveLength(CONTENT_KEY_LENGTH);
    expect(() => assertContentKeyLength(key)).not.toThrow();
  });

  it("assertContentKeyLength rejects wrong sizes", () => {
    expect(() => assertContentKeyLength(new Uint8Array(16))).toThrow(
      InvalidContentKeyError,
    );
  });
});
