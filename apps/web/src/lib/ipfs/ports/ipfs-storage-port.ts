import type { Cid, IpfsUri, PinOptions, PinResult } from "../types";

export type IpfsStoragePort = {
  pinBlob(data: Uint8Array, options?: PinOptions): Promise<PinResult>;
  pinJson(data: unknown, options?: PinOptions): Promise<PinResult>;
  toGatewayUrl(cid: Cid | IpfsUri): string;
};
