import type { ApiErrorCode } from "@/lib/i18n/api-error-codes";
import type { TranslationParams } from "@/lib/i18n/types";
import {
  mapAuthorErrorToCode,
  mapAuthorErrorToMessage,
  mapAuthorErrorToStatus,
} from "@/lib/authors/api-errors";
import { IpfsConfigError, IpfsMetadataValidationError } from "@/lib/ipfs/errors";
import { UserSuspendedError } from "@/lib/users/errors";

import {
  ForbiddenContentKeyError,
  InvalidOwnerAddressError,
  InvalidTokenIdParamError,
  InvalidWorkIdParamError,
  MintEnvelopeError,
  WorkMintError,
  WorkUploadDuplicateError,
  WorkUploadMetadataExistsError,
  WorkUploadValidationError,
} from "./errors";

export function mapWorkErrorToStatus(error: unknown): number {
  if (
    error instanceof InvalidWorkIdParamError ||
    error instanceof InvalidTokenIdParamError ||
    error instanceof InvalidOwnerAddressError
  ) {
    return 400;
  }

  if (
    error instanceof WorkUploadValidationError ||
    error instanceof ForbiddenContentKeyError ||
    error instanceof IpfsMetadataValidationError ||
    error instanceof MintEnvelopeError
  ) {
    return 422;
  }

  if (error instanceof WorkMintError) {
    return 404;
  }

  if (error instanceof WorkUploadMetadataExistsError) {
    return 409;
  }

  if (error instanceof WorkUploadDuplicateError) {
    return 409;
  }

  if (error instanceof IpfsConfigError) {
    return 500;
  }

  if (error instanceof UserSuspendedError) {
    return 403;
  }

  return mapAuthorErrorToStatus(error);
}

export function mapWorkErrorToMessage(error: unknown): string {
  if (error instanceof InvalidWorkIdParamError) {
    return "Invalid work id.";
  }

  if (error instanceof InvalidTokenIdParamError) {
    return "Invalid token id.";
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

  if (error instanceof WorkUploadMetadataExistsError) {
    return "Work upload metadata already exists.";
  }

  if (error instanceof WorkUploadDuplicateError) {
    return error.message;
  }

  if (error instanceof MintEnvelopeError) {
    return error.message;
  }

  if (error instanceof WorkMintError) {
    return error.message;
  }

  if (error instanceof IpfsMetadataValidationError) {
    return "Generated metadata failed security validation.";
  }

  if (error instanceof IpfsConfigError) {
    return "Unexpected server error.";
  }

  if (error instanceof UserSuspendedError) {
    return error.message;
  }

  return mapAuthorErrorToMessage(error);
}

export function mapWorkErrorToCode(error: unknown): ApiErrorCode {
  if (error instanceof InvalidWorkIdParamError) {
    return "invalid_work_id";
  }

  if (error instanceof InvalidTokenIdParamError) {
    return "invalid_token_id";
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

  if (error instanceof WorkUploadMetadataExistsError) {
    return "work_upload_metadata_exists";
  }

  if (error instanceof WorkUploadDuplicateError) {
    return "work_upload_duplicate";
  }

  if (error instanceof MintEnvelopeError) {
    return "work_upload_validation";
  }

  if (error instanceof WorkMintError) {
    return "unexpected";
  }

  if (error instanceof IpfsMetadataValidationError) {
    return "ipfs_metadata_validation";
  }

  if (error instanceof UserSuspendedError) {
    return "user_suspended";
  }

  return mapAuthorErrorToCode(error);
}

export function mapWorkErrorToParams(error: unknown): TranslationParams | undefined {
  if (error instanceof WorkUploadValidationError) {
    return { detail: error.message };
  }
  if (error instanceof MintEnvelopeError) {
    return { detail: error.message };
  }
  return undefined;
}
