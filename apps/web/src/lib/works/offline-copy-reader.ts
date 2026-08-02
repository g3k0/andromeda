import { DEFAULT_CONTENT_GATEWAY_BASES } from "@/lib/ipfs/gateway-url";
import { isArweaveUri } from "@/lib/ipfs/content-uri";
import {
  decodeUtf8,
  readWorkContent,
  type FetchBytes,
  type FetchJson,
} from "@/lib/works/reader-client";
import { createReaderSignerFromSignature } from "@/lib/works/reader-signer";

/**
 * Minimal chain reads for offline ACE discovery — no Andromeda API / Mongo.
 * Backed by RPC `tokenURI` + `envelopeURIOfToken`.
 */
export type OfflineCopyChainReads = {
  tokenURI(tokenId: bigint): Promise<string>;
  envelopeURIOfToken(tokenId: bigint): Promise<string>;
};

export type OfflineCopyUris = {
  metadataUri: string;
  envelopeUri: string;
};

export class OfflineCopyDiscoveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OfflineCopyDiscoveryError";
  }
}

/**
 * Resolves content URIs for a minted copy from chain only.
 * Prefer `ar://` (Production cutover); legacy `ipfs://` is accepted for dual-read.
 */
export async function resolveOfflineCopyUris(
  tokenId: bigint,
  chain: OfflineCopyChainReads,
): Promise<OfflineCopyUris> {
  if (tokenId <= 0n) {
    throw new OfflineCopyDiscoveryError("tokenId must be a positive integer");
  }

  const [metadataUri, envelopeUri] = await Promise.all([
    chain.tokenURI(tokenId),
    chain.envelopeURIOfToken(tokenId),
  ]);

  const metadata = metadataUri?.trim() ?? "";
  const envelope = envelopeUri?.trim() ?? "";

  if (!metadata) {
    throw new OfflineCopyDiscoveryError("tokenURI is empty on-chain");
  }
  if (!envelope) {
    throw new OfflineCopyDiscoveryError(
      "envelopeURIOfToken is empty — copy envelope not provisioned on-chain",
    );
  }

  return { metadataUri: metadata, envelopeUri: envelope };
}

export function assertArweaveCopyUris(uris: OfflineCopyUris): void {
  if (!isArweaveUri(uris.metadataUri)) {
    throw new OfflineCopyDiscoveryError(
      `Expected ar:// metadata URI, got ${uris.metadataUri}`,
    );
  }
  if (!isArweaveUri(uris.envelopeUri)) {
    throw new OfflineCopyDiscoveryError(
      `Expected ar:// envelope URI, got ${uris.envelopeUri}`,
    );
  }
}

export type ReadOfflineCopyInput = {
  tokenId: bigint;
  chain: OfflineCopyChainReads;
  /** Wallet signature of `READER_KEY_SIGNATURE_MESSAGE`. */
  signature: `0x${string}`;
  fetchJson: FetchJson;
  fetchBytes: FetchBytes;
  /** When true (default), require `ar://` URIs for DoD / Production cutover. */
  requireArweave?: boolean;
};

/**
 * Discovers URIs from chain, fetches ACE blobs via injected fetchers, decrypts locally.
 * No Andromeda HTTP API is used.
 */
export async function readOfflineCopy(
  input: ReadOfflineCopyInput,
): Promise<{ text: string; uris: OfflineCopyUris }> {
  const uris = await resolveOfflineCopyUris(input.tokenId, input.chain);
  if (input.requireArweave !== false) {
    assertArweaveCopyUris(uris);
  }

  const bytes = await readWorkContent({
    metadataUrl: uris.metadataUri,
    envelopeUrl: uris.envelopeUri,
    contentGateways: DEFAULT_CONTENT_GATEWAY_BASES,
    tbaSigner: createReaderSignerFromSignature(input.signature),
    fetchJson: input.fetchJson,
    fetchBytes: input.fetchBytes,
  });

  return { text: decodeUtf8(bytes), uris };
}
