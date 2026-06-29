import { toGatewayUrl } from "../gateway-url";
import { cidFromContent, cidFromJson, toJsonBytes } from "../cid";
import type { IpfsStoragePort } from "../ports/ipfs-storage-port";
import { toIpfsUri } from "../types";

export type InMemoryIpfsRecord = {
  cid: ReturnType<typeof cidFromContent>;
  bytes: Uint8Array;
  name?: string;
};

export type InMemoryIpfsState = {
  records: Map<string, InMemoryIpfsRecord>;
  gatewayBaseUrl: string;
};

export function createInMemoryIpfsState(options?: {
  gatewayBaseUrl?: string;
}): InMemoryIpfsState {
  return {
    records: new Map(),
    gatewayBaseUrl:
      options?.gatewayBaseUrl ?? "https://gateway.pinata.cloud/ipfs",
  };
}

export function createInMemoryIpfsStorage(
  state: InMemoryIpfsState,
): IpfsStoragePort {
  return {
    async pinBlob(data, options) {
      const cid = cidFromContent(data);
      state.records.set(cid, {
        cid,
        bytes: data.slice(),
        name: options?.name,
      });

      return {
        cid,
        uri: toIpfsUri(cid),
        size: data.byteLength,
      };
    },

    async pinJson(data, options) {
      const bytes = toJsonBytes(data);
      const cid = cidFromJson(data);
      state.records.set(cid, {
        cid,
        bytes,
        name: options?.name,
      });

      return {
        cid,
        uri: toIpfsUri(cid),
        size: bytes.byteLength,
      };
    },

    toGatewayUrl(cidOrUri) {
      return toGatewayUrl(cidOrUri, state.gatewayBaseUrl);
    },
  };
}

export function getInMemoryIpfsRecord(
  state: InMemoryIpfsState,
  cid: string,
): InMemoryIpfsRecord | undefined {
  return state.records.get(cid);
}
