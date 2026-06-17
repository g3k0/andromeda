import { describe, expect, it } from "vitest";

import { generateContentKey } from "./ace-spec";
import { unwrapContentKey, wrapContentKey } from "./envelope";
import {
  EnvelopeUnwrapError,
  InvalidContentKeyError,
  InvalidEnvelopeError,
} from "./errors";
import {
  createDeterministicTbaKeyFixture,
  createTbaKeyFixture,
} from "./testing/key-fixtures";

describe("ECIES envelope", () => {
  it("wraps and unwraps a content key for a TBA public key", () => {
    const contentKey = generateContentKey();
    const tbaKeys = createTbaKeyFixture();

    const envelope = wrapContentKey(contentKey, tbaKeys.publicKey);
    const unwrapped = unwrapContentKey(envelope, tbaKeys.privateKey);

    expect(unwrapped).toEqual(contentKey);
    expect(envelope[0]).toBe(1);
  });

  it("supports deterministic fixtures for stable tests", () => {
    const contentKey = createDeterministicTbaKeyFixture(7).privateKey;
    const tbaKeys = createDeterministicTbaKeyFixture(9);
    const envelope = wrapContentKey(contentKey, tbaKeys.publicKey);

    expect(unwrapContentKey(envelope, tbaKeys.privateKey)).toEqual(contentKey);
  });

  it("rejects envelopes with unsupported versions", () => {
    const tbaKeys = createTbaKeyFixture();
    const envelope = wrapContentKey(generateContentKey(), tbaKeys.publicKey);
    const invalid = new Uint8Array(envelope);
    invalid[0] = 99;

    expect(() => unwrapContentKey(invalid, tbaKeys.privateKey)).toThrow(
      InvalidEnvelopeError,
    );
  });

  it("rejects unwrap with the wrong private key", () => {
    const envelope = wrapContentKey(
      generateContentKey(),
      createTbaKeyFixture().publicKey,
    );
    const otherKeys = createTbaKeyFixture();

    expect(() => unwrapContentKey(envelope, otherKeys.privateKey)).toThrow(
      EnvelopeUnwrapError,
    );
  });

  it("rejects invalid content key length on wrap", () => {
    expect(() =>
      wrapContentKey(new Uint8Array(16), createTbaKeyFixture().publicKey),
    ).toThrow(InvalidContentKeyError);
  });
});
