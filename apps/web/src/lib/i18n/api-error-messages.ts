import {
  WalletAuthExpiredError,
  WalletAuthMessageInvalidError,
  WalletAuthReplayError,
  WalletSignatureInvalidError,
} from "@/lib/auth/errors";
import { RouteAccessDeniedError } from "@/lib/navigation/route-guard";
import type { ApiErrorCode } from "./api-error-codes";
import { isApiErrorCode } from "./api-error-codes";
import type { TranslationParams } from "./types";
import type { TranslateFn } from "./translate";

const API_ERROR_I18N_KEYS: Record<ApiErrorCode, string> = {
  invalid_payload: "api.errors.invalidPayload",
  wallet_auth_failed: "api.errors.walletAuthFailed",
  wallet_auth_expired: "api.errors.walletAuthExpired",
  not_authorized: "api.errors.notAuthorized",
  rate_limited: "api.errors.rateLimited",
  author_profile_exists: "api.errors.authorProfileExists",
  author_profile_not_found: "api.errors.authorProfileNotFound",
  invalid_address: "api.errors.invalidAddress",
  user_not_found: "api.errors.userNotFound",
  user_exists: "api.errors.userExists",
  user_suspended: "api.errors.userSuspended",
  invalid_permission_overrides: "api.errors.invalidPermissionOverrides",
  role_not_found: "api.errors.roleNotFound",
  role_exists: "api.errors.roleExists",
  role_in_use: "api.errors.roleInUse",
  invalid_role_slug: "api.errors.invalidRoleSlug",
  invalid_role_permissions: "api.errors.invalidRolePermissions",
  system_role_mutation: "api.errors.systemRoleMutation",
  admin_role_lockout: "api.errors.adminRoleLockout",
  invalid_work_id: "api.errors.invalidWorkId",
  invalid_owner_address: "api.errors.invalidOwnerAddress",
  work_upload_validation: "api.errors.workUploadValidation",
  work_upload_metadata_exists: "api.errors.workUploadMetadataExists",
  work_upload_duplicate: "api.errors.workUploadDuplicate",
  forbidden_content_key: "api.errors.forbiddenContentKey",
  ipfs_metadata_validation: "api.errors.ipfsMetadataValidation",
  unexpected: "api.errors.unexpected",
  wallet_auth_message_failed: "api.errors.walletAuthMessageFailed",
};

export class ApiClientError extends Error {
  readonly code: ApiErrorCode;
  readonly params?: TranslationParams;

  constructor(code: ApiErrorCode, params?: TranslationParams, message?: string) {
    super(message ?? code);
    this.name = "ApiClientError";
    this.code = code;
    this.params = params;
  }
}

export function translateApiErrorCode(
  t: TranslateFn,
  code: ApiErrorCode,
  params?: TranslationParams,
): string {
  return t(API_ERROR_I18N_KEYS[code], params);
}

export function parseApiErrorBody(
  body: unknown,
): { code: ApiErrorCode; params?: TranslationParams } | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  if (!isApiErrorCode(record.code)) {
    return null;
  }

  const params =
    record.params && typeof record.params === "object"
      ? (record.params as TranslationParams)
      : undefined;

  return { code: record.code, params };
}

export function translateApiErrorBody(
  t: TranslateFn,
  body: unknown,
): string {
  const parsed = parseApiErrorBody(body);
  if (parsed) {
    return translateApiErrorCode(t, parsed.code, parsed.params);
  }
  return t("api.errors.unexpected");
}

export function translateClientError(t: TranslateFn, error: unknown): string {
  if (error instanceof ApiClientError) {
    return translateApiErrorCode(t, error.code, error.params);
  }

  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    const params =
      "params" in error && error.params && typeof error.params === "object"
        ? (error.params as TranslationParams)
        : undefined;
    const translated = t(error.code, params);
    if (!translated.startsWith("[missing:")) {
      return translated;
    }
  }

  if (error instanceof WalletAuthExpiredError) {
    return t("api.errors.walletAuthExpired");
  }

  if (
    error instanceof WalletSignatureInvalidError ||
    error instanceof WalletAuthMessageInvalidError ||
    error instanceof WalletAuthReplayError
  ) {
    return t("api.errors.walletAuthFailed");
  }

  if (error instanceof RouteAccessDeniedError) {
    return t("api.errors.notAuthorized");
  }

  if (error instanceof Error && isApiErrorCode(error.message)) {
    return translateApiErrorCode(t, error.message);
  }

  return t("api.errors.unexpected");
}
