import type { ApiErrorCode } from "@/lib/i18n/api-error-codes";
import type { TranslationParams } from "@/lib/i18n/types";
import {
  mapAuthorErrorToCode,
  mapAuthorErrorToMessage,
  mapAuthorErrorToStatus,
} from "@/lib/authors/api-errors";
import {
  AdminRoleLockoutError,
  InvalidRolePermissionsError,
  InvalidRoleSlugError,
  RoleExistsError,
  RoleInUseError,
  RoleNotFoundError,
  SystemRoleMutationError,
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
  if (error instanceof RoleNotFoundError) {
    return error.message;
  }
  if (error instanceof RoleExistsError) {
    return error.message;
  }
  if (error instanceof RoleInUseError) {
    return error.message;
  }
  if (error instanceof InvalidRoleSlugError) {
    return error.message;
  }
  if (error instanceof InvalidRolePermissionsError) {
    return error.message;
  }
  if (error instanceof SystemRoleMutationError) {
    return error.message;
  }
  if (error instanceof AdminRoleLockoutError) {
    return error.message;
  }
  return mapAuthorErrorToMessage(error);
}

export function mapRoleErrorToCode(error: unknown): ApiErrorCode {
  if (error instanceof RoleNotFoundError) {
    return "role_not_found";
  }
  if (error instanceof RoleExistsError) {
    return "role_exists";
  }
  if (error instanceof RoleInUseError) {
    return "role_in_use";
  }
  if (error instanceof InvalidRoleSlugError) {
    return "invalid_role_slug";
  }
  if (error instanceof InvalidRolePermissionsError) {
    return "invalid_role_permissions";
  }
  if (error instanceof SystemRoleMutationError) {
    return "system_role_mutation";
  }
  if (error instanceof AdminRoleLockoutError) {
    return "admin_role_lockout";
  }
  return mapAuthorErrorToCode(error);
}

export function mapRoleErrorToParams(error: unknown): TranslationParams | undefined {
  if (error instanceof RoleInUseError) {
    return {
      slug: error.slug,
      count: error.userCount,
    };
  }
  if (error instanceof RoleNotFoundError || error instanceof RoleExistsError) {
    return { slug: error.slug };
  }
  if (error instanceof InvalidRoleSlugError) {
    return { slug: error.slug };
  }
  return undefined;
}
