import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { buildRateLimitKey } from "@/lib/auth/rate-limit-key";
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
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return buildRateLimitKey(ip, scope);
}

export function enforceRateLimit(
  request: Request,
  scope?: string,
): NextResponse | null {
  const allowed = checkRateLimit(getRequestRateLimitKey(request, scope));
  if (!allowed) {
    return jsonResponse({ error: "Too many requests." }, 429);
  }
  return null;
}
