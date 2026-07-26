import { parseContentLocator } from "./content-uri";
import { parseIpfsUri, type Cid } from "./types";

export const DEFAULT_ARWEAVE_GATEWAY_BASE_URL = "https://arweave.net";

export type ContentGatewayBases = {
  ipfs: string;
  arweave: string;
};

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
