import "server-only";

import { IpfsConfigError } from "./errors";

const DEFAULT_GATEWAY_BASE_URL = "https://gateway.pinata.cloud/ipfs";

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
