import { mapAuthorErrorToMessage, mapAuthorErrorToStatus } from "@/lib/authors/api-errors";
import {
  InvalidRolePermissionsError,
  InvalidRoleSlugError,
  RoleExistsError,
  RoleInUseError,
  RoleNotFoundError,
  SystemRoleMutationError,
  AdminRoleLockoutError,
} from "./errors";

export function mapRoleErrorToStatus(error: unknown): number {
  if (error instanceof RoleNotFoundError) {
    return 404;
  }
  if (error instanceof RoleExistsError) {
    return 409;
  }
  if (error instanceof RoleInUseError) {
    return 409;
  }
  if (
    error instanceof InvalidRoleSlugError ||
    error instanceof InvalidRolePermissionsError ||
    error instanceof SystemRoleMutationError ||
    error instanceof AdminRoleLockoutError
  ) {
    return 422;
  }

  return mapAuthorErrorToStatus(error);
}

export function mapRoleErrorToMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return mapAuthorErrorToMessage(error);
}
