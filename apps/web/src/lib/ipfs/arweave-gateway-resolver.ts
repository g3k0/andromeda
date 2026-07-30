import { parseArweaveUri, toArweaveUri } from "./content-uri";

/** Public Arweave gateway bases used when env does not provide a list. */
export const DEFAULT_ARWEAVE_GATEWAY_URLS: readonly string[] = [
  "https://arweave.net",
  "https://ar-io.net",
];

export class ArweaveGatewayUnreachableError extends Error {
  constructor(message = "Content could not be reached on Arweave") {
    super(message);
    this.name = "ArweaveGatewayUnreachableError";
  }
}

export function normalizeGatewayBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/** Deduplicates and normalizes gateway bases without appending defaults. */
export function normalizeGatewayUrlList(urls: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const url of urls) {
    const normalized = normalizeGatewayBaseUrl(url);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
}

/** Parses a comma-separated gateway list into normalized unique bases. */
export function parseArweaveGatewayUrls(raw: string): string[] {
  return normalizeGatewayUrlList(raw.split(","));
}

/**
 * Builds an ordered failover list: explicit URLs first, then primary, then defaults.
 * Deduplicates while preserving order. Used for env/config assembly.
 */
export function resolveArweaveGatewayUrls(options?: {
  urls?: readonly string[];
  primary?: string;
}): string[] {
  return normalizeGatewayUrlList([
    ...(options?.urls ?? []),
    ...(options?.primary ? [options.primary] : []),
    ...DEFAULT_ARWEAVE_GATEWAY_URLS,
  ]);
}

export function toArweaveGatewayHttpsUrl(
  uriOrId: string,
  gatewayBaseUrl: string,
): string {
  const id = uriOrId.startsWith("ar://")
    ? parseArweaveUri(uriOrId)
    : uriOrId.trim();
  if (!id) {
    throw new Error("Expected a non-empty Arweave transaction id");
  }
  return `${normalizeGatewayBaseUrl(gatewayBaseUrl)}/${id}`;
}

export type FetchWithArweaveFailoverInput = {
  /** `ar://…` URI or bare transaction / data-item id. */
  uriOrId: string;
  gatewayUrls: readonly string[];
  fetchImpl?: typeof fetch;
  init?: RequestInit;
};

async function fetchFromGatewayAtIndex(input: {
  id: string;
  gatewayUrls: readonly string[];
  fetchImpl: typeof fetch;
  init?: RequestInit;
  index: number;
}): Promise<Response> {
  if (input.index >= input.gatewayUrls.length) {
    throw new ArweaveGatewayUnreachableError();
  }

  const url = toArweaveGatewayHttpsUrl(
    input.id,
    input.gatewayUrls[input.index]!,
  );

  try {
    const response = await input.fetchImpl(url, input.init);
    if (response.ok) {
      return response;
    }
  } catch {
    // Try the next gateway in the failover list.
  }

  return fetchFromGatewayAtIndex({
    ...input,
    index: input.index + 1,
  });
}

/**
 * Fetches an Arweave data item, trying each gateway until one returns OK.
 * Uses the provided list as-is (normalized); does not append public defaults.
 */
export async function fetchWithArweaveFailover(
  input: FetchWithArweaveFailoverInput,
): Promise<Response> {
  const id = parseArweaveUri(toArweaveUri(input.uriOrId));
  const gatewayUrls = normalizeGatewayUrlList(input.gatewayUrls);
  if (gatewayUrls.length === 0) {
    throw new ArweaveGatewayUnreachableError();
  }

  return fetchFromGatewayAtIndex({
    id,
    gatewayUrls,
    fetchImpl: input.fetchImpl ?? fetch,
    init: input.init,
    index: 0,
  });
}

export async function fetchBytesWithArweaveFailover(
  input: FetchWithArweaveFailoverInput,
): Promise<Uint8Array> {
  const response = await fetchWithArweaveFailover(input);
  return new Uint8Array(await response.arrayBuffer());
}
