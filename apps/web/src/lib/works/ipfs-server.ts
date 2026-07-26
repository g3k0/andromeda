import "server-only";

import { adaptIpfsStorageToPermanent } from "@/lib/ipfs/adapters/ipfs-as-permanent-storage";
import { createPinataIpfsStorageFromEnv } from "@/lib/ipfs/adapters/pinata-ipfs-storage";
import {
  getArweaveGatewayBaseUrl,
  getIpfsGatewayBaseUrl,
  getPermanentStorageBackend,
  getPinataIpfsStorageEnvConfig,
} from "@/lib/ipfs/ipfs-config";
import { IpfsConfigError } from "@/lib/ipfs/errors";
import type { IpfsStoragePort } from "@/lib/ipfs/ports/ipfs-storage-port";
import type { PermanentStoragePort } from "@/lib/ipfs/ports/permanent-storage-port";

let cachedIpfsStorage: IpfsStoragePort | null = null;
let cachedPermanentStorage: PermanentStoragePort | null = null;

export function getIpfsStorage(): IpfsStoragePort {
  if (!cachedIpfsStorage) {
    cachedIpfsStorage = createPinataIpfsStorageFromEnv(
      getPinataIpfsStorageEnvConfig(),
    );
  }
  return cachedIpfsStorage;
}

/**
 * Permanent storage entry point for new code.
 * Default backend is Pinata (via IPFS adapter) until the Arweave cutover.
 */
export function getPermanentStorage(): PermanentStoragePort {
  if (!cachedPermanentStorage) {
    const backend = getPermanentStorageBackend();
    if (backend === "pinata") {
      cachedPermanentStorage = adaptIpfsStorageToPermanent(getIpfsStorage(), {
        ipfsGatewayBaseUrl: getIpfsGatewayBaseUrl(),
        arweaveGatewayBaseUrl: getArweaveGatewayBaseUrl(),
      });
    } else {
      throw new IpfsConfigError(
        'PERMANENT_STORAGE_BACKEND="arweave" is not implemented yet. Use "pinata".',
      );
    }
  }
  return cachedPermanentStorage;
}

/** @internal Resets cached storage between tests. */
export function resetIpfsStorageForTests(): void {
  cachedIpfsStorage = null;
  cachedPermanentStorage = null;
}

export function setIpfsStorageForTests(storage: IpfsStoragePort | null): void {
  cachedIpfsStorage = storage;
  cachedPermanentStorage = null;
}

export function setPermanentStorageForTests(
  storage: PermanentStoragePort | null,
): void {
  cachedPermanentStorage = storage;
}
