import { NextResponse } from "next/server";

import { mapWorkErrorToMessage, mapWorkErrorToStatus } from "./api-errors";

export function jsonResponse(
  body: unknown,
  status = 200,
  headers?: HeadersInit,
): NextResponse {
  return NextResponse.json(body, { status, headers });
}

export function workErrorResponse(error: unknown): NextResponse {
  const status = mapWorkErrorToStatus(error);
  const message =
    status >= 500 ? "Unexpected server error." : mapWorkErrorToMessage(error);
  return jsonResponse({ error: message }, status);
}
