import type { ContentUri } from "../content-uri";
import {
  DEFAULT_ARWEAVE_GATEWAY_BASE_URL,
  toContentGatewayUrl,
  type ContentGatewayBases,
} from "../gateway-url";
import type { IpfsStoragePort } from "../ports/ipfs-storage-port";
import type {
  PermanentStoragePort,
  UploadOptions,
  UploadResult,
} from "../ports/permanent-storage-port";

export type AdaptIpfsStorageOptions = {
  ipfsGatewayBaseUrl: string;
  arweaveGatewayBaseUrl?: string;
};

function toUploadResult(pin: {
  cid: string;
  uri: `ipfs://${string}`;
  size: number;
}): UploadResult {
  return {
    id: pin.cid,
    uri: pin.uri,
    size: pin.size,
  };
}

/** Adapts the legacy IPFS pin port to the permanent storage port (Pinata path). */
export function adaptIpfsStorageToPermanent(
  ipfs: IpfsStoragePort,
  options: AdaptIpfsStorageOptions,
): PermanentStoragePort {
  const gateways: ContentGatewayBases = {
    ipfs: options.ipfsGatewayBaseUrl,
    arweave:
      options.arweaveGatewayBaseUrl ?? DEFAULT_ARWEAVE_GATEWAY_BASE_URL,
  };

  return {
    async uploadBlob(
      data: Uint8Array,
      uploadOptions?: UploadOptions,
    ): Promise<UploadResult> {
      return toUploadResult(await ipfs.pinBlob(data, uploadOptions));
    },

    async uploadJson(
      data: unknown,
      uploadOptions?: UploadOptions,
    ): Promise<UploadResult> {
      return toUploadResult(await ipfs.pinJson(data, uploadOptions));
    },

    toGatewayUrl(uri: ContentUri | string): string {
      return toContentGatewayUrl(uri, gateways);
    },
  };
}
