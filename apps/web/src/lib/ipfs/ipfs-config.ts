import "server-only";

import {
  parseArweaveGatewayUrls,
  resolveArweaveGatewayUrls,
} from "./arweave-gateway-resolver";
import {
  DEFAULT_ARWEAVE_GATEWAY_BASE_URL,
  type ContentGatewayBases,
} from "./gateway-url";
import { IpfsConfigError } from "./errors";

const DEFAULT_GATEWAY_BASE_URL = "https://gateway.pinata.cloud/ipfs";

export type PermanentStorageBackend = "pinata" | "arweave";

/**
 * Resolves the permanent-storage write backend.
 * - Vercel Preview always writes to Arweave (Pinata down must not block Preview).
 * - Default (unset) is Arweave; Pinata remains an explicit legacy opt-in.
 */
export function resolvePermanentStorageBackend(input: {
  configured?: string | null;
  vercelEnv?: string | null;
}): PermanentStorageBackend {
  if (input.vercelEnv?.trim().toLowerCase() === "preview") {
    return "arweave";
  }

  const configured = input.configured?.trim().toLowerCase();
  if (!configured || configured === "arweave") {
    return "arweave";
  }
  if (configured === "pinata") {
    return "pinata";
  }
  throw new IpfsConfigError(
    `Unsupported PERMANENT_STORAGE_BACKEND "${configured}". Use "pinata" or "arweave".`,
  );
}

export function getPermanentStorageBackend(): PermanentStorageBackend {
  return resolvePermanentStorageBackend({
    configured: process.env.PERMANENT_STORAGE_BACKEND,
    vercelEnv: process.env.VERCEL_ENV,
  });
}

export function getIpfsPinningApiKey(): string {
  const apiKey = process.env.IPFS_PINNING_API_KEY?.trim();
  if (!apiKey) {
    throw new IpfsConfigError("IPFS_PINNING_API_KEY is not configured");
  }

  return apiKey;
}

export function getIpfsGatewayBaseUrl(): string {
  const configured =
    process.env.IPFS_GATEWAY_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_IPFS_GATEWAY_BASE_URL?.trim();

  return (configured || DEFAULT_GATEWAY_BASE_URL).replace(/\/+$/, "");
}

export function getArweaveGatewayBaseUrl(): string {
  const urls = getArweaveGatewayUrls();
  return urls[0] ?? DEFAULT_ARWEAVE_GATEWAY_BASE_URL;
}

/**
 * Ordered Arweave gateway bases for read failover.
 * Prefer `ARWEAVE_GATEWAY_URLS` (comma-separated); falls back to the single
 * primary base URL env vars, then public defaults (`arweave.net`, `ar-io.net`).
 */
export function getArweaveGatewayUrls(): string[] {
  const listRaw =
    process.env.ARWEAVE_GATEWAY_URLS?.trim() ||
    process.env.NEXT_PUBLIC_ARWEAVE_GATEWAY_URLS?.trim();
  const primary =
    process.env.ARWEAVE_GATEWAY_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_ARWEAVE_GATEWAY_BASE_URL?.trim();

  return resolveArweaveGatewayUrls({
    urls: listRaw ? parseArweaveGatewayUrls(listRaw) : undefined,
    primary: primary || undefined,
  });
}

/** Paired gateways for resolving `ipfs://` and `ar://` content URIs. */
export function getContentGatewayBases(): ContentGatewayBases {
  const arweaveUrls = getArweaveGatewayUrls();
  return {
    ipfs: getIpfsGatewayBaseUrl(),
    arweave: arweaveUrls[0] ?? DEFAULT_ARWEAVE_GATEWAY_BASE_URL,
    arweaveUrls,
  };
}

/**
 * Arweave JWK used to authenticate Turbo uploads.
 * Prefer `ARWEAVE_JWK`; `ARWEAVE_TURBO_JWK` is accepted as an alias.
 */
export function getArweaveJwkRaw(): string {
  const raw =
    process.env.ARWEAVE_JWK?.trim() ||
    process.env.ARWEAVE_TURBO_JWK?.trim();
  if (!raw) {
    throw new IpfsConfigError(
      "ARWEAVE_JWK is not configured (required when PERMANENT_STORAGE_BACKEND=arweave)",
    );
  }
  return raw;
}

export type PinataIpfsStorageEnvConfig = {
  apiKey: string;
  gatewayBaseUrl: string;
};

export function getPinataIpfsStorageEnvConfig(): PinataIpfsStorageEnvConfig {
  return {
    apiKey: getIpfsPinningApiKey(),
    gatewayBaseUrl: getIpfsGatewayBaseUrl(),
  };
}

export type ArweaveTurboStorageEnvConfig = {
  jwkRaw: string;
  gatewayBaseUrl: string;
  gatewayUrls: string[];
};

export function getArweaveTurboStorageEnvConfig(): ArweaveTurboStorageEnvConfig {
  const gatewayUrls = getArweaveGatewayUrls();
  return {
    jwkRaw: getArweaveJwkRaw(),
    gatewayBaseUrl: gatewayUrls[0] ?? DEFAULT_ARWEAVE_GATEWAY_BASE_URL,
    gatewayUrls,
  };
}
