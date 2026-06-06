import "server-only";

import { headers } from "next/headers";
import { RateLimitExceededError } from "./errors";
import { checkRateLimit } from "./rate-limit";
import { buildRateLimitKey } from "./rate-limit-key";

export async function enforceActionRateLimit(scope: string): Promise<void> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(buildRateLimitKey(ip, scope))) {
    throw new RateLimitExceededError();
  }
}
