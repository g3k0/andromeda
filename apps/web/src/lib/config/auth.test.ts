import { afterEach, describe, expect, it } from "vitest";
import {
  getAuthMessageRateLimit,
  getRateLimitMaxRequests,
  getRateLimitWindowMs,
  getWalletAuthNonceTtlMs,
  getWalletBindingTtlMs,
  getWalletSessionTtlMs,
} from "./auth";
import { resetServerEnvForTests } from "./env";

describe("auth config", () => {
  afterEach(() => {
    resetServerEnvForTests();
  });

  it("uses default TTL and rate-limit values", () => {
    expect(getWalletSessionTtlMs()).toBe(15 * 60 * 1000);
    expect(getWalletBindingTtlMs()).toBe(24 * 60 * 60 * 1000);
    expect(getWalletAuthNonceTtlMs()).toBe(5 * 60 * 1000);
    expect(getRateLimitMaxRequests()).toBe(30);
    expect(getRateLimitWindowMs()).toBe(60_000);
    expect(getAuthMessageRateLimit()).toBe(10);
  });

  it("applies environment overrides", () => {
    process.env.WALLET_SESSION_TTL_MINUTES = "20";
    process.env.WALLET_BINDING_TTL_HOURS = "12";
    process.env.WALLET_AUTH_NONCE_TTL_MINUTES = "3";
    process.env.RATE_LIMIT_MAX_REQUESTS = "40";
    process.env.RATE_LIMIT_WINDOW_MS = "120000";
    process.env.AUTH_MESSAGE_RATE_LIMIT = "5";

    expect(getWalletSessionTtlMs()).toBe(20 * 60 * 1000);
    expect(getWalletBindingTtlMs()).toBe(12 * 60 * 60 * 1000);
    expect(getWalletAuthNonceTtlMs()).toBe(3 * 60 * 1000);
    expect(getRateLimitMaxRequests()).toBe(40);
    expect(getRateLimitWindowMs()).toBe(120_000);
    expect(getAuthMessageRateLimit()).toBe(5);
  });
});
