import { afterEach, describe, expect, it, vi } from "vitest";
import { RateLimitExceededError } from "./errors";
import { resetRateLimitsForTests } from "./rate-limit";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

import { headers } from "next/headers";
import { enforceActionRateLimit } from "./action-rate-limit";

const mockedHeaders = vi.mocked(headers);

describe("enforceActionRateLimit", () => {
  afterEach(() => {
    resetRateLimitsForTests();
    vi.clearAllMocks();
  });

  it("allows requests within the configured limit", async () => {
    mockedHeaders.mockResolvedValue(
      new Headers({ "x-forwarded-for": "203.0.113.44" }) as never,
    );

    await expect(
      enforceActionRateLimit("create-author:0xabc"),
    ).resolves.toBeUndefined();
  });

  it("throws when the limit is exceeded", async () => {
    mockedHeaders.mockResolvedValue(
      new Headers({ "x-forwarded-for": "203.0.113.55" }) as never,
    );

    for (let attempt = 0; attempt < 30; attempt += 1) {
      await enforceActionRateLimit("create-author:0xdef");
    }

    await expect(
      enforceActionRateLimit("create-author:0xdef"),
    ).rejects.toBeInstanceOf(RateLimitExceededError);
  });
});
