import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { RateLimitExceededError } from "@/lib/auth/errors";
import {
  resetRateLimitsForTests,
  useInMemoryRateLimitsForTests,
} from "@/lib/auth/rate-limit";
import { resetServerEnvForTests } from "@/lib/config/env";

import {
  assertWorkUploadIpRateLimit,
  assertWorkUploadWalletRateLimit,
} from "./work-upload-rate-limit";

const AUTHOR = "0x1111111111111111111111111111111111111111";

function requestWithIp(ip: string): Request {
  return new Request("http://localhost/api/works/upload", {
    method: "POST",
    headers: {
      "x-forwarded-for": ip,
    },
  });
}

describe("work upload rate limits", () => {
  afterEach(() => {
    resetRateLimitsForTests();
    resetServerEnvForTests();
    delete process.env.TRUST_PROXY;
  });

  beforeEach(() => {
    resetRateLimitsForTests();
    useInMemoryRateLimitsForTests();
    process.env.TRUST_PROXY = "true";
    process.env.WORK_UPLOAD_IP_RATE_LIMIT_MAX_REQUESTS = "2";
    process.env.WORK_UPLOAD_WALLET_RATE_LIMIT_MAX_REQUESTS = "2";
  });

  it("blocks IP-scoped upload bursts", async () => {
    const request = requestWithIp("203.0.113.44");

    await expect(assertWorkUploadIpRateLimit(request)).resolves.toBeUndefined();
    await expect(assertWorkUploadIpRateLimit(request)).resolves.toBeUndefined();
    await expect(assertWorkUploadIpRateLimit(request)).rejects.toBeInstanceOf(
      RateLimitExceededError,
    );
  });

  it("blocks per-author upload quotas independently of other wallets", async () => {
    const request = requestWithIp("203.0.113.45");
    const otherAuthor = "0x2222222222222222222222222222222222222222";

    await expect(
      assertWorkUploadWalletRateLimit(request, AUTHOR),
    ).resolves.toBeUndefined();
    await expect(
      assertWorkUploadWalletRateLimit(request, AUTHOR),
    ).resolves.toBeUndefined();
    await expect(
      assertWorkUploadWalletRateLimit(request, AUTHOR),
    ).rejects.toBeInstanceOf(RateLimitExceededError);

    await expect(
      assertWorkUploadWalletRateLimit(request, otherAuthor),
    ).resolves.toBeUndefined();
  });
});
