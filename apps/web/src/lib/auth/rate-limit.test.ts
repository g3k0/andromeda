import { afterEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimitsForTests } from "./rate-limit";

describe("checkRateLimit", () => {
  afterEach(() => {
    resetRateLimitsForTests();
  });

  it("allows requests under the limit", () => {
    const now = 1_000;
    expect(checkRateLimit("ip:1", 2, 60_000, now)).toBe(true);
    expect(checkRateLimit("ip:1", 2, 60_000, now + 1)).toBe(true);
  });

  it("blocks requests above the limit", () => {
    const now = 1_000;
    expect(checkRateLimit("ip:2", 1, 60_000, now)).toBe(true);
    expect(checkRateLimit("ip:2", 1, 60_000, now + 1)).toBe(false);
  });
});
