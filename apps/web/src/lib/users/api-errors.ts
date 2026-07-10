import { ZodError } from "zod";
import type { ApiErrorCode } from "@/lib/i18n/api-error-codes";
import { InvalidAddressError } from "@/lib/authors/errors";
import {
  mapAuthorErrorToCode,
  mapAuthorErrorToMessage,
  mapAuthorErrorToStatus,
} from "@/lib/authors/api-errors";
import { RouteAccessDeniedError } from "@/lib/navigation/route-guard";
import {
  InvalidPermissionOverridesError,
  UserExistsError,
  UserNotFoundError,
  UserSuspendedError,
} from "./errors";

export function mapUserErrorToStatus(error: unknown): number {
  if (error instanceof UserExistsError) {
    return 409;
  }
  if (
    error instanceof UserNotFoundError ||
    error instanceof InvalidAddressError
  ) {
    return 404;
  }
  if (error instanceof UserSuspendedError) {
    return 403;
  }
  if (error instanceof InvalidPermissionOverridesError) {
    return 422;
  }
  if (error instanceof RouteAccessDeniedError) {
    return 403;
  }
  return mapAuthorErrorToStatus(error);
}

export function mapUserErrorToMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return "Invalid request payload.";
  }
  if (error instanceof UserExistsError) {
    return error.message;
  }
  if (error instanceof UserNotFoundError) {
    return error.message;
  }
  if (error instanceof UserSuspendedError) {
    return error.message;
  }
  if (error instanceof InvalidPermissionOverridesError) {
    return error.message;
  }
  return mapAuthorErrorToMessage(error);
}

export function mapUserErrorToCode(error: unknown): ApiErrorCode {
  if (error instanceof ZodError) {
    return "invalid_payload";
  }
  if (error instanceof UserExistsError) {
    return "user_exists";
  }
  if (error instanceof UserNotFoundError) {
    return "user_not_found";
  }
  if (error instanceof UserSuspendedError) {
    return "user_suspended";
  }
  if (error instanceof InvalidPermissionOverridesError) {
    return "invalid_permission_overrides";
  }
  return mapAuthorErrorToCode(error);
}
