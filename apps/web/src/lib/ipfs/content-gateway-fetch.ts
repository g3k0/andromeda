import {
  ArweaveGatewayUnreachableError,
  fetchWithArweaveFailover,
} from "./arweave-gateway-resolver";
import { isArweaveUri } from "./content-uri";
import {
  getArweaveGatewayUrlsFromBases,
  toContentGatewayUrl,
  type ContentGatewayBases,
} from "./gateway-url";

export type FetchContentFromGatewaysInput = {
  uriOrId: string;
  gateways: ContentGatewayBases;
  fetchImpl?: typeof fetch;
  init?: RequestInit;
};

/**
 * Fetches content for `ar://` (with gateway failover) or `ipfs://` / raw CID
 * (single IPFS gateway). Throws `ArweaveGatewayUnreachableError` when every
 * Arweave gateway fails.
 */
export async function fetchContentFromGateways(
  input: FetchContentFromGatewaysInput,
): Promise<Response> {
  const fetchImpl = input.fetchImpl ?? fetch;

  if (isArweaveUri(input.uriOrId)) {
    return fetchWithArweaveFailover({
      uriOrId: input.uriOrId,
      gatewayUrls: getArweaveGatewayUrlsFromBases(input.gateways),
      fetchImpl,
      init: input.init,
    });
  }

  const url = toContentGatewayUrl(input.uriOrId, input.gateways);
  return fetchImpl(url, input.init);
}

export async function fetchContentBytesFromGateways(
  input: FetchContentFromGatewaysInput,
): Promise<Uint8Array> {
  const response = await fetchContentFromGateways(input);
  if (!response.ok) {
    if (isArweaveUri(input.uriOrId)) {
      throw new ArweaveGatewayUnreachableError();
    }
    throw new Error(`Failed to fetch content (${response.status})`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

export { ArweaveGatewayUnreachableError };
