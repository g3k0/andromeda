import { beforeEach, describe, expect, it } from "vitest";
import {
  checkRateLimit,
  resetRateLimitsForTests,
  useInMemoryRateLimitsForTests,
} from "./rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimitsForTests();
    useInMemoryRateLimitsForTests();
  });

  it("allows requests until the limit is reached", async () => {
    const now = Date.now();
    await expect(checkRateLimit("ip:1", 2, 60_000, now)).resolves.toBe(true);
    await expect(checkRateLimit("ip:1", 2, 60_000, now + 1)).resolves.toBe(
      true,
    );
  });

  it("blocks requests after the limit is reached", async () => {
    const now = Date.now();
    await expect(checkRateLimit("ip:2", 1, 60_000, now)).resolves.toBe(true);
    await expect(checkRateLimit("ip:2", 1, 60_000, now + 1)).resolves.toBe(
      false,
    );
  });
});
