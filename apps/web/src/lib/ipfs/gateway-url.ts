import {
  DEFAULT_ARWEAVE_GATEWAY_URLS,
  normalizeGatewayUrlList,
} from "./arweave-gateway-resolver";
import { parseContentLocator } from "./content-uri";
import { parseIpfsUri, type Cid } from "./types";

export const DEFAULT_ARWEAVE_GATEWAY_BASE_URL =
  DEFAULT_ARWEAVE_GATEWAY_URLS[0] ?? "https://arweave.net";

export type ContentGatewayBases = {
  ipfs: string;
  /** Primary Arweave gateway (first failover candidate); used for display URLs. */
  arweave: string;
  /** Ordered Arweave gateways for read failover. Defaults to `[arweave]` when omitted. */
  arweaveUrls?: readonly string[];
};

/** Public defaults for client-safe content URL resolution (avatars, etc.). */
export const DEFAULT_CONTENT_GATEWAY_BASES: ContentGatewayBases = {
  ipfs: "https://ipfs.io/ipfs",
  arweave: DEFAULT_ARWEAVE_GATEWAY_BASE_URL,
  arweaveUrls: [...DEFAULT_ARWEAVE_GATEWAY_URLS],
};

/** Effective Arweave failover list for a gateway config. */
export function getArweaveGatewayUrlsFromBases(
  gateways: ContentGatewayBases,
): string[] {
  if (gateways.arweaveUrls?.length) {
    return normalizeGatewayUrlList(gateways.arweaveUrls);
  }
  return normalizeGatewayUrlList([gateways.arweave]);
}

/**
 * Legacy IPFS-only helper. Prefer `toContentGatewayUrl` for new code that may
 * receive `ar://` URIs.
 */
export function toGatewayUrl(
  cidOrUri: Cid | string,
  gatewayBaseUrl: string,
): string {
  const base = gatewayBaseUrl.replace(/\/+$/, "");
  const cid =
    typeof cidOrUri === "string" && cidOrUri.startsWith("ipfs://")
      ? parseIpfsUri(cidOrUri)
      : (cidOrUri as Cid);

  return `${base}/${cid}`;
}

/**
 * Resolves `ipfs://`, `ar://`, or a raw IPFS CID to an HTTPS gateway URL.
 * Raw ids are treated as IPFS CIDs for backward compatibility.
 */
export function toContentGatewayUrl(
  uriOrId: string,
  gateways: ContentGatewayBases,
): string {
  const { scheme, id } = parseContentLocator(uriOrId);
  if (scheme === "ar") {
    const base = gateways.arweave.replace(/\/+$/, "");
    return `${base}/${id}`;
  }

  const base = gateways.ipfs.replace(/\/+$/, "");
  return `${base}/${id}`;
}
