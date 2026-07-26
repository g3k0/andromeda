import { adaptIpfsStorageToPermanent } from "../adapters/ipfs-as-permanent-storage";
import type { PermanentStoragePort } from "../ports/permanent-storage-port";
import {
  createInMemoryIpfsState,
  createInMemoryIpfsStorage,
  type InMemoryIpfsState,
} from "./in-memory-ipfs-storage";

export type InMemoryPermanentStorageOptions = {
  state?: InMemoryIpfsState;
  ipfsGatewayBaseUrl?: string;
  arweaveGatewayBaseUrl?: string;
};

/** Pinata-compatible permanent storage backed by the in-memory IPFS fake. */
export function createInMemoryPermanentStorage(
  options?: InMemoryPermanentStorageOptions,
): {
  storage: PermanentStoragePort;
  state: InMemoryIpfsState;
} {
  const state = options?.state ?? createInMemoryIpfsState();
  const storage = adaptIpfsStorageToPermanent(createInMemoryIpfsStorage(state), {
    ipfsGatewayBaseUrl:
      options?.ipfsGatewayBaseUrl ?? "https://gateway.test/ipfs",
    arweaveGatewayBaseUrl:
      options?.arweaveGatewayBaseUrl ?? "https://arweave.test",
  });
  return { storage, state };
}
