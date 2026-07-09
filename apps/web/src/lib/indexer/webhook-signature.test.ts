import { describe, expect, it } from "vitest";

import {
  computeAlchemySignature,
  verifyAlchemySignature,
} from "./webhook-signature";

const SIGNING_KEY = "whsec_test_signing_key";
const BODY = JSON.stringify({ webhookId: "wh_1", event: { data: {} } });

describe("webhook signature", () => {
  it("computes a deterministic hex HMAC-SHA256", () => {
    const a = computeAlchemySignature(BODY, SIGNING_KEY);
    const b = computeAlchemySignature(BODY, SIGNING_KEY);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("accepts a valid signature", () => {
    const signature = computeAlchemySignature(BODY, SIGNING_KEY);
    expect(verifyAlchemySignature(BODY, signature, SIGNING_KEY)).toBe(true);
  });

  it("rejects a tampered body", () => {
    const signature = computeAlchemySignature(BODY, SIGNING_KEY);
    expect(
      verifyAlchemySignature(`${BODY} `, signature, SIGNING_KEY),
    ).toBe(false);
  });

  it("rejects a wrong signing key", () => {
    const signature = computeAlchemySignature(BODY, "other_key");
    expect(verifyAlchemySignature(BODY, signature, SIGNING_KEY)).toBe(false);
  });

  it("rejects missing or malformed signatures", () => {
    expect(verifyAlchemySignature(BODY, null, SIGNING_KEY)).toBe(false);
    expect(verifyAlchemySignature(BODY, "", SIGNING_KEY)).toBe(false);
    expect(verifyAlchemySignature(BODY, "zz", SIGNING_KEY)).toBe(false);
  });

  it("rejects when no signing key is configured", () => {
    const signature = computeAlchemySignature(BODY, SIGNING_KEY);
    expect(verifyAlchemySignature(BODY, signature, "")).toBe(false);
  });
});
