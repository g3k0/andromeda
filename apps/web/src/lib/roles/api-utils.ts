import { NextResponse } from "next/server";
import { enforceRateLimit as enforceUserRateLimit } from "@/lib/users/api-utils";
import { mapRoleErrorToMessage, mapRoleErrorToStatus } from "./api-errors";

export function jsonResponse(
  body: unknown,
  status = 200,
  headers?: HeadersInit,
): NextResponse {
  return NextResponse.json(body, { status, headers });
}

export function errorResponse(error: unknown): NextResponse {
  const status = mapRoleErrorToStatus(error);
  const message =
    status >= 500 ? "Unexpected server error." : mapRoleErrorToMessage(error);
  return jsonResponse({ error: message }, status);
}

export async function enforceRateLimit(
  request: Request,
  scope?: string,
): Promise<NextResponse | null> {
  return enforceUserRateLimit(request, scope);
}
