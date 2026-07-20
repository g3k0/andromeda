export const API_ERROR_CODES = [
  "invalid_payload",
  "wallet_auth_failed",
  "wallet_auth_expired",
  "not_authorized",
  "rate_limited",
  "author_profile_exists",
  "author_profile_not_found",
  "invalid_address",
  "user_not_found",
  "user_exists",
  "user_suspended",
  "invalid_permission_overrides",
  "role_not_found",
  "role_exists",
  "role_in_use",
  "invalid_role_slug",
  "invalid_role_permissions",
  "system_role_mutation",
  "admin_role_lockout",
  "invalid_work_id",
  "invalid_token_id",
  "invalid_owner_address",
  "work_upload_validation",
  "work_upload_metadata_exists",
  "work_upload_duplicate",
  "forbidden_content_key",
  "ipfs_metadata_validation",
  "unexpected",
  "wallet_auth_message_failed",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return (
    typeof value === "string" &&
    (API_ERROR_CODES as readonly string[]).includes(value)
  );
}
