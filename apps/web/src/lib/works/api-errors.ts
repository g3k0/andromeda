import { mapAuthorErrorToMessage, mapAuthorErrorToStatus } from "@/lib/authors/api-errors";
import { IpfsConfigError, IpfsMetadataValidationError } from "@/lib/ipfs/errors";

import {
  ForbiddenContentKeyError,
  InvalidWorkIdParamError,
  WorkUploadValidationError,
} from "./errors";

export function mapWorkErrorToStatus(error: unknown): number {
  if (error instanceof InvalidWorkIdParamError) {
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
