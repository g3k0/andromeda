import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { buildRateLimitKey } from "@/lib/auth/rate-limit-key";
import { getTrustedClientIp } from "@/lib/auth/trusted-client-ip";
import {
  mapAuthorErrorToMessage,
  mapAuthorErrorToStatus,
} from "./api-errors";

export function jsonResponse(
  body: unknown,
  status = 200,
  headers?: HeadersInit,
): NextResponse {
  return NextResponse.json(body, { status, headers });
}

export function errorResponse(error: unknown): NextResponse {
  const status = mapAuthorErrorToStatus(error);
  const message =
    status >= 500 ? "Unexpected server error." : mapAuthorErrorToMessage(error);
  return jsonResponse({ error: message }, status);
}

export function getRequestRateLimitKey(
  request: Request,
  scope?: string,
): string {
  return buildRateLimitKey(getTrustedClientIp(request.headers), scope);
}

export async function enforceRateLimit(
  request: Request,
  scope?: string,
  limit?: number,
): Promise<NextResponse | null> {
  const allowed = await checkRateLimit(
    getRequestRateLimitKey(request, scope),
    limit,
  );
  if (!allowed) {
    return jsonResponse({ error: "Too many requests." }, 429);
  }
  return null;
}
