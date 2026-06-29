import "server-only";

import { createPinataIpfsStorageFromEnv } from "@/lib/ipfs/adapters/pinata-ipfs-storage";
import { getPinataIpfsStorageEnvConfig } from "@/lib/ipfs/ipfs-config";
import type { IpfsStoragePort } from "@/lib/ipfs/ports/ipfs-storage-port";

let cachedStorage: IpfsStoragePort | null = null;

export function getIpfsStorage(): IpfsStoragePort {
  if (!cachedStorage) {
    cachedStorage = createPinataIpfsStorageFromEnv(getPinataIpfsStorageEnvConfig());
  }
  return cachedStorage;
}

/** @internal Resets cached storage between tests. */
export function resetIpfsStorageForTests(): void {
  cachedStorage = null;
}

export function setIpfsStorageForTests(storage: IpfsStoragePort | null): void {
  cachedStorage = storage;
}
