/** Content identifier returned by a pinning provider. */
export type Cid = string & { readonly __brand: "Cid" };

/** IPFS URI referencing pinned content (`ipfs://…`). */
export type IpfsUri = `ipfs://${string}`;

export type PinOptions = {
  name?: string;
};

export type PinResult = {
  cid: Cid;
  uri: IpfsUri;
  size: number;
};

export function asCid(value: string): Cid {
  return value as Cid;
}

export function toIpfsUri(cid: Cid): IpfsUri {
  return `ipfs://${cid}`;
}

export function parseIpfsUri(uri: string): Cid {
  if (!uri.startsWith("ipfs://")) {
    throw new Error(`Expected ipfs:// URI, got ${uri}`);
  }

  const cid = uri.slice("ipfs://".length).trim();
  if (!cid) {
    throw new Error("Expected ipfs:// URI to include a CID");
  }

  return asCid(cid);
}
