import { asCid, parseIpfsUri, type Cid, type IpfsUri } from "./types";

/** Arweave transaction / data-item URI (`ar://…`). */
export type ArweaveUri = `ar://${string}`;

/**
 * Canonical content locator used by permanent storage.
 * `ar://` is the migration target; `ipfs://` remains for legacy reads/writes.
 */
export type ContentUri = ArweaveUri | IpfsUri;

export type ContentUriScheme = "ar" | "ipfs";

export function isArweaveUri(value: string): value is ArweaveUri {
  return value.startsWith("ar://");
}

export function isIpfsUri(value: string): value is IpfsUri {
  return value.startsWith("ipfs://");
}

export function isContentUri(value: string): value is ContentUri {
  return isArweaveUri(value) || isIpfsUri(value);
}

export function toArweaveUri(id: string): ArweaveUri {
  const trimmed = id.trim();
  if (!trimmed) {
    throw new Error("Expected a non-empty Arweave transaction id");
  }
  if (trimmed.startsWith("ar://")) {
    return trimmed as ArweaveUri;
  }
  return `ar://${trimmed}`;
}

export function parseArweaveUri(uri: string): string {
  if (!isArweaveUri(uri)) {
    throw new Error(`Expected ar:// URI, got ${uri}`);
  }
  const id = uri.slice("ar://".length).trim();
  if (!id) {
    throw new Error("Expected ar:// URI to include a transaction id");
  }
  return id;
}

/** Returns the bare id (CID or Arweave tx id) for a content URI or raw CID. */
export function parseContentLocator(uriOrId: string): {
  scheme: ContentUriScheme | "raw";
  id: string;
} {
  if (isArweaveUri(uriOrId)) {
    return { scheme: "ar", id: parseArweaveUri(uriOrId) };
  }
  if (isIpfsUri(uriOrId)) {
    return { scheme: "ipfs", id: parseIpfsUri(uriOrId) };
  }
  return { scheme: "raw", id: asCid(uriOrId.trim()) };
}

export type { Cid, IpfsUri };
