import "server-only";

import { DEFAULT_ARWEAVE_GATEWAY_BASE_URL } from "./gateway-url";
import { IpfsConfigError } from "./errors";

const DEFAULT_GATEWAY_BASE_URL = "https://gateway.pinata.cloud/ipfs";

export type PermanentStorageBackend = "pinata" | "arweave";

export function getPermanentStorageBackend(): PermanentStorageBackend {
  const configured = process.env.PERMANENT_STORAGE_BACKEND?.trim().toLowerCase();
  if (!configured || configured === "pinata") {
    return "pinata";
  }
  if (configured === "arweave") {
    return "arweave";
  }
  throw new IpfsConfigError(
    `Unsupported PERMANENT_STORAGE_BACKEND "${configured}". Use "pinata" or "arweave".`,
  );
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
  const configured =
    process.env.ARWEAVE_GATEWAY_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_ARWEAVE_GATEWAY_BASE_URL?.trim();

  return (configured || DEFAULT_ARWEAVE_GATEWAY_BASE_URL).replace(/\/+$/, "");
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
