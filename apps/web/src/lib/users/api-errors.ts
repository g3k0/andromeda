import { ZodError } from "zod";
import { InvalidAddressError } from "@/lib/authors/errors";
import {
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
  return mapAuthorErrorToMessage(error);
}
