import type { ApiErrorCode } from "@/lib/i18n/api-error-codes";
import type { TranslationParams } from "@/lib/i18n/types";
import {
  mapAuthorErrorToCode,
  mapAuthorErrorToMessage,
  mapAuthorErrorToStatus,
} from "@/lib/authors/api-errors";
import { IpfsConfigError, IpfsMetadataValidationError } from "@/lib/ipfs/errors";

import {
  ForbiddenContentKeyError,
  InvalidOwnerAddressError,
  InvalidWorkIdParamError,
  WorkUploadValidationError,
} from "./errors";

export function mapWorkErrorToStatus(error: unknown): number {
  if (
    error instanceof InvalidWorkIdParamError ||
    error instanceof InvalidOwnerAddressError
  ) {
    return 400;
  }

  if (
    error instanceof WorkUploadValidationError ||
    error instanceof ForbiddenContentKeyError ||
    error instanceof IpfsMetadataValidationError
  ) {
    return 422;
  }

  if (error instanceof IpfsConfigError) {
    return 500;
  }

  return mapAuthorErrorToStatus(error);
}

export function mapWorkErrorToMessage(error: unknown): string {
  if (error instanceof InvalidWorkIdParamError) {
    return "Invalid work id.";
  }

  if (error instanceof InvalidOwnerAddressError) {
    return "Invalid owner address.";
  }

  if (error instanceof WorkUploadValidationError) {
    return error.message;
  }

  if (error instanceof ForbiddenContentKeyError) {
    return "Content keys must never be sent to the server.";
  }

  if (error instanceof IpfsMetadataValidationError) {
    return "Generated metadata failed security validation.";
  }

  if (error instanceof IpfsConfigError) {
    return "Unexpected server error.";
  }

  return mapAuthorErrorToMessage(error);
}

export function mapWorkErrorToCode(error: unknown): ApiErrorCode {
  if (error instanceof InvalidWorkIdParamError) {
    return "invalid_work_id";
  }

  if (error instanceof InvalidOwnerAddressError) {
    return "invalid_owner_address";
  }

  if (error instanceof WorkUploadValidationError) {
    return "work_upload_validation";
  }

  if (error instanceof ForbiddenContentKeyError) {
    return "forbidden_content_key";
  }

  if (error instanceof IpfsMetadataValidationError) {
    return "ipfs_metadata_validation";
  }

  return mapAuthorErrorToCode(error);
}

export function mapWorkErrorToParams(error: unknown): TranslationParams | undefined {
  if (error instanceof WorkUploadValidationError) {
    return { detail: error.message };
  }
  return undefined;
}
