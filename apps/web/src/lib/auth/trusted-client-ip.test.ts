import { afterEach, describe, expect, it } from "vitest";
import { resetServerEnvForTests } from "@/lib/config/env";
import { getTrustedClientIp } from "./trusted-client-ip";

describe("getTrustedClientIp", () => {
  afterEach(() => {
    delete process.env.TRUST_PROXY;
    resetServerEnvForTests();
  });

  it("ignores forwarded headers unless TRUST_PROXY is enabled", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 198.51.100.20",
    });

    expect(getTrustedClientIp(headers)).toBe("unknown");
  });

  it("uses the first forwarded IP when TRUST_PROXY is enabled", () => {
    process.env.TRUST_PROXY = "true";
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.10, 198.51.100.20",
    });

    expect(getTrustedClientIp(headers)).toBe("203.0.113.10");
  });

  it("falls back to x-real-ip when forwarded-for is absent", () => {
    process.env.TRUST_PROXY = "true";
    const headers = new Headers({
      "x-real-ip": "198.51.100.20",
    });

    expect(getTrustedClientIp(headers)).toBe("198.51.100.20");
  });
});
