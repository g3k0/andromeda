import { NextResponse } from "next/server";
import { enforceRateLimit as enforceUserRateLimit } from "@/lib/users/api-utils";
import { buildApiErrorBody } from "@/lib/api/error-response";
import {
  mapRoleErrorToCode,
  mapRoleErrorToMessage,
  mapRoleErrorToParams,
  mapRoleErrorToStatus,
} from "./api-errors";

export function jsonResponse(
  body: unknown,
  status = 200,
  headers?: HeadersInit,
): NextResponse {
  return NextResponse.json(body, { status, headers });
}

export function errorResponse(error: unknown): NextResponse {
  const status = mapRoleErrorToStatus(error);
  const body = buildApiErrorBody(
    error,
    mapRoleErrorToStatus,
    mapRoleErrorToMessage,
    mapRoleErrorToCode,
    mapRoleErrorToParams,
  );
  return jsonResponse(body, status);
}

export async function enforceRateLimit(
  request: Request,
  scope?: string,
): Promise<NextResponse | null> {
  return enforceUserRateLimit(request, scope);
}
