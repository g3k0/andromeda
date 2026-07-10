import { ZodError } from "zod";
import type { ApiErrorCode } from "@/lib/i18n/api-error-codes";
import {
  AuthorProfileExistsError,
  AuthorProfileNotFoundError,
  InvalidAddressError,
} from "./errors";
import { RouteAccessDeniedError } from "@/lib/navigation/route-guard";
import {
  RateLimitExceededError,
  WalletAuthExpiredError,
  WalletAuthMessageInvalidError,
  WalletAuthReplayError,
  WalletAuthorizationError,
  WalletSignatureInvalidError,
} from "@/lib/auth/errors";

export function mapAuthorErrorToStatus(error: unknown): number {
  if (error instanceof ZodError) {
    return 422;
  }
  if (
    error instanceof WalletSignatureInvalidError ||
    error instanceof WalletAuthMessageInvalidError
  ) {
    return 401;
  }
  if (
    error instanceof WalletAuthExpiredError ||
    error instanceof WalletAuthReplayError
  ) {
    return 401;
  }
  if (
    error instanceof WalletAuthorizationError ||
    error instanceof RouteAccessDeniedError
  ) {
    return 403;
  }
  if (error instanceof RateLimitExceededError) {
    return 429;
  }
  if (error instanceof AuthorProfileExistsError) {
    return 409;
  }
  if (
    error instanceof AuthorProfileNotFoundError ||
    error instanceof InvalidAddressError
  ) {
    return 404;
  }
  return 500;
}

export function mapAuthorErrorToMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return "Invalid request payload.";
  }
  if (
    error instanceof WalletSignatureInvalidError ||
    error instanceof WalletAuthMessageInvalidError ||
    error instanceof WalletAuthReplayError
  ) {
    return "Wallet authentication failed.";
  }
  if (error instanceof WalletAuthExpiredError) {
    return "Wallet authentication message has expired.";
  }
  if (
    error instanceof WalletAuthorizationError ||
    error instanceof RouteAccessDeniedError
  ) {
    return "Not authorized.";
  }
  if (error instanceof RateLimitExceededError) {
    return "Too many requests.";
  }
  if (error instanceof AuthorProfileExistsError) {
    return "Author profile already exists.";
  }
  if (error instanceof AuthorProfileNotFoundError) {
    return "Author profile not found.";
  }
  if (error instanceof InvalidAddressError) {
    return "Invalid Ethereum address.";
  }
  return "Unexpected server error.";
}

export function mapAuthorErrorToCode(error: unknown): ApiErrorCode {
  if (error instanceof ZodError) {
    return "invalid_payload";
  }
  if (error instanceof WalletAuthExpiredError) {
    return "wallet_auth_expired";
  }
  if (
    error instanceof WalletSignatureInvalidError ||
    error instanceof WalletAuthMessageInvalidError ||
    error instanceof WalletAuthReplayError
  ) {
    return "wallet_auth_failed";
  }
  if (
    error instanceof WalletAuthorizationError ||
    error instanceof RouteAccessDeniedError
  ) {
    return "not_authorized";
  }
  if (error instanceof RateLimitExceededError) {
    return "rate_limited";
  }
  if (error instanceof AuthorProfileExistsError) {
    return "author_profile_exists";
  }
  if (error instanceof AuthorProfileNotFoundError) {
    return "author_profile_not_found";
  }
  if (error instanceof InvalidAddressError) {
    return "invalid_address";
  }
  return "unexpected";
}
