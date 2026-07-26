import type { ContentUri } from "../content-uri";

export type UploadOptions = {
  name?: string;
};

export type UploadResult = {
  /** Provider-native id (IPFS CID or Arweave tx / data-item id). */
  id: string;
  uri: ContentUri;
  size: number;
};

/**
 * Permanent content storage port.
 * Domain code should prefer this over the legacy Pinata-oriented `IpfsStoragePort`.
 */
export type PermanentStoragePort = {
  uploadBlob(data: Uint8Array, options?: UploadOptions): Promise<UploadResult>;
  uploadJson(data: unknown, options?: UploadOptions): Promise<UploadResult>;
  toGatewayUrl(uri: ContentUri | string): string;
  fetchBytes?(uri: ContentUri): Promise<Uint8Array>;
};
