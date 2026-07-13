import "server-only";

import { RateLimitExceededError } from "@/lib/auth/errors";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { buildRateLimitKey } from "@/lib/auth/rate-limit-key";
import { getTrustedClientIp } from "@/lib/auth/trusted-client-ip";
import {
  getWorkUploadIpRateLimitMaxRequests,
  getWorkUploadIpRateLimitWindowMs,
  getWorkUploadWalletRateLimitMaxRequests,
  getWorkUploadWalletRateLimitWindowMs,
} from "@/lib/config/auth";

function normalizeAuthorAddress(address: string): string {
  return address.toLowerCase();
}

/** IP-scoped burst limit applied before parsing multipart upload bodies. */
export async function assertWorkUploadIpRateLimit(
  request: Request,
): Promise<void> {
  const allowed = await checkRateLimit(
    buildRateLimitKey(getTrustedClientIp(request.headers), "works-upload"),
    getWorkUploadIpRateLimitMaxRequests(),
    getWorkUploadIpRateLimitWindowMs(),
  );
  if (!allowed) {
    throw new RateLimitExceededError();
  }
}

/** Per-author quota applied after wallet signature verification. */
export async function assertWorkUploadWalletRateLimit(
  request: Request,
  authorAddress: string,
): Promise<void> {
  const normalized = normalizeAuthorAddress(authorAddress);
  const allowed = await checkRateLimit(
    buildRateLimitKey(
      getTrustedClientIp(request.headers),
      `works-upload:${normalized}`,
    ),
    getWorkUploadWalletRateLimitMaxRequests(),
    getWorkUploadWalletRateLimitWindowMs(),
  );
  if (!allowed) {
    throw new RateLimitExceededError();
  }
}
