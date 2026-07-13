import "server-only";

import { getServerEnv } from "./env";

export const AUTH_MESSAGE_PREFIX =
  "Andromeda wants you to sign in with your wallet.";

const DEFAULT_WALLET_SESSION_TTL_MINUTES = 15;
const DEFAULT_WALLET_BINDING_TTL_HOURS = 24;
const DEFAULT_WALLET_AUTH_NONCE_TTL_MINUTES = 5;
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 30;
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_AUTH_MESSAGE_RATE_LIMIT = 10;
const DEFAULT_WORK_UPLOAD_IP_RATE_LIMIT_MAX_REQUESTS = 10;
const DEFAULT_WORK_UPLOAD_IP_RATE_LIMIT_WINDOW_MS = 60_000;
const DEFAULT_WORK_UPLOAD_WALLET_RATE_LIMIT_MAX_REQUESTS = 5;
const DEFAULT_WORK_UPLOAD_WALLET_RATE_LIMIT_WINDOW_MS = 3_600_000;

export function getWalletSessionTtlMs(): number {
  const minutes =
    getServerEnv().WALLET_SESSION_TTL_MINUTES ??
    DEFAULT_WALLET_SESSION_TTL_MINUTES;
  return minutes * 60 * 1000;
}

export function getWalletBindingTtlMs(): number {
  const hours =
    getServerEnv().WALLET_BINDING_TTL_HOURS ?? DEFAULT_WALLET_BINDING_TTL_HOURS;
  return hours * 60 * 60 * 1000;
}

export function getWalletAuthNonceTtlMs(): number {
  const minutes =
    getServerEnv().WALLET_AUTH_NONCE_TTL_MINUTES ??
    DEFAULT_WALLET_AUTH_NONCE_TTL_MINUTES;
  return minutes * 60 * 1000;
}

export function getRateLimitMaxRequests(): number {
  return (
    getServerEnv().RATE_LIMIT_MAX_REQUESTS ?? DEFAULT_RATE_LIMIT_MAX_REQUESTS
  );
}

export function getRateLimitWindowMs(): number {
  return getServerEnv().RATE_LIMIT_WINDOW_MS ?? DEFAULT_RATE_LIMIT_WINDOW_MS;
}

export function getAuthMessageRateLimit(): number {
  return (
    getServerEnv().AUTH_MESSAGE_RATE_LIMIT ?? DEFAULT_AUTH_MESSAGE_RATE_LIMIT
  );
}

export function getWorkUploadIpRateLimitMaxRequests(): number {
  return (
    getServerEnv().WORK_UPLOAD_IP_RATE_LIMIT_MAX_REQUESTS ??
    DEFAULT_WORK_UPLOAD_IP_RATE_LIMIT_MAX_REQUESTS
  );
}

export function getWorkUploadIpRateLimitWindowMs(): number {
  return (
    getServerEnv().WORK_UPLOAD_IP_RATE_LIMIT_WINDOW_MS ??
    DEFAULT_WORK_UPLOAD_IP_RATE_LIMIT_WINDOW_MS
  );
}

export function getWorkUploadWalletRateLimitMaxRequests(): number {
  return (
    getServerEnv().WORK_UPLOAD_WALLET_RATE_LIMIT_MAX_REQUESTS ??
    DEFAULT_WORK_UPLOAD_WALLET_RATE_LIMIT_MAX_REQUESTS
  );
}

export function getWorkUploadWalletRateLimitWindowMs(): number {
  return (
    getServerEnv().WORK_UPLOAD_WALLET_RATE_LIMIT_WINDOW_MS ??
    DEFAULT_WORK_UPLOAD_WALLET_RATE_LIMIT_WINDOW_MS
  );
}
