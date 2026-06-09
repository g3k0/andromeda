import "server-only";

import { headers } from "next/headers";
import { RateLimitExceededError } from "./errors";
import { checkRateLimit } from "./rate-limit";
import { buildRateLimitKey } from "./rate-limit-key";
import { getTrustedClientIp } from "./trusted-client-ip";

export async function enforceActionRateLimit(scope: string): Promise<void> {
  const headerList = await headers();

  if (!(await checkRateLimit(buildRateLimitKey(getTrustedClientIp(headerList), scope)))) {
    throw new RateLimitExceededError();
  }
}
