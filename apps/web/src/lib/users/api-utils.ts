import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { buildRateLimitKey } from "@/lib/auth/rate-limit-key";
import { getTrustedClientIp } from "@/lib/auth/trusted-client-ip";
import { buildApiErrorBody } from "@/lib/api/error-response";
import { mapUserErrorToCode, mapUserErrorToMessage, mapUserErrorToStatus } from "./api-errors";

export function jsonResponse(
  body: unknown,
  status = 200,
  headers?: HeadersInit,
): NextResponse {
  return NextResponse.json(body, { status, headers });
}

export function errorResponse(error: unknown): NextResponse {
  const status = mapUserErrorToStatus(error);
  const body = buildApiErrorBody(
    error,
    mapUserErrorToStatus,
    mapUserErrorToMessage,
    mapUserErrorToCode,
  );
  return jsonResponse(body, status);
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
): Promise<NextResponse | null> {
  const allowed = await checkRateLimit(getRequestRateLimitKey(request, scope));
  if (!allowed) {
    return jsonResponse(
      {
        error: "Too many requests.",
        code: "rate_limited",
      },
      429,
    );
  }
  return null;
}
