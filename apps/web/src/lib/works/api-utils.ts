import { NextResponse } from "next/server";

import { buildApiErrorBody } from "@/lib/api/error-response";
import {
  mapWorkErrorToCode,
  mapWorkErrorToMessage,
  mapWorkErrorToParams,
  mapWorkErrorToStatus,
} from "./api-errors";

export function jsonResponse(
  body: unknown,
  status = 200,
  headers?: HeadersInit,
): NextResponse {
  return NextResponse.json(body, { status, headers });
}

export function workErrorResponse(error: unknown): NextResponse {
  const status = mapWorkErrorToStatus(error);
  const body = buildApiErrorBody(
    error,
    mapWorkErrorToStatus,
    mapWorkErrorToMessage,
    mapWorkErrorToCode,
    mapWorkErrorToParams,
  );
  return jsonResponse(body, status);
}
