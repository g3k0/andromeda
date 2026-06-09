import { ZodError } from "zod";
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
    error instanceof WalletAuthExpiredError ||
    error instanceof WalletAuthReplayError
  ) {
    return "Wallet authentication failed.";
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
