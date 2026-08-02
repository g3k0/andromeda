/**
 * Offline ACE reference reader — RPC + ar:// gateways + decrypt.
 * No Andromeda HTTP API / Mongo required.
 *
 * Usage (from apps/web):
 *   pnpm reference-reader -- \
 *     --rpc=https://rpc-amoy.polygon.technology \
 *     --contract=0x… \
 *     --token-id=10 \
 *     --signature=0x…
 *
 * Sign message: "Andromeda reader key v1" (see READER_KEY_SIGNATURE_MESSAGE).
 * Optional: --allow-ipfs to skip the ar:// DoD check (legacy dual-read).
 */
import { loadEnvConfig } from "@next/env";
import {
  createPublicClient,
  http,
  type Abi,
  type PublicClient,
} from "viem";
import { polygon, polygonAmoy } from "viem/chains";

import { andromedaWorksAbi } from "@/lib/chain/contract";
import {
  fetchContentBytesFromGateways,
  fetchContentFromGateways,
} from "@/lib/ipfs/content-gateway-fetch";
import {
  DEFAULT_CONTENT_GATEWAY_BASES,
  type ContentGatewayBases,
} from "@/lib/ipfs/gateway-url";
import { READER_KEY_SIGNATURE_MESSAGE } from "@/lib/works/reader-signer";
import { readOfflineCopy } from "@/lib/works/offline-copy-reader";

loadEnvConfig(process.cwd());

function parseArgs(argv: string[]): {
  rpc: string | null;
  contract: `0x${string}` | null;
  tokenId: bigint | null;
  signature: `0x${string}` | null;
  allowIpfs: boolean;
  chain: "amoy" | "polygon";
} {
  let rpc: string | null = null;
  let contract: `0x${string}` | null = null;
  let tokenId: bigint | null = null;
  let signature: `0x${string}` | null = null;
  let allowIpfs = false;
  let chain: "amoy" | "polygon" = "amoy";

  for (const arg of argv) {
    if (arg.startsWith("--rpc=")) {
      rpc = arg.slice("--rpc=".length);
    } else if (arg.startsWith("--contract=")) {
      contract = arg.slice("--contract=".length) as `0x${string}`;
    } else if (arg.startsWith("--token-id=")) {
      const raw = arg.slice("--token-id=".length);
      if (!/^\d+$/.test(raw)) {
        throw new Error(`Invalid --token-id=${raw}`);
      }
      tokenId = BigInt(raw);
    } else if (arg.startsWith("--signature=")) {
      signature = arg.slice("--signature=".length) as `0x${string}`;
    } else if (arg === "--allow-ipfs") {
      allowIpfs = true;
    } else if (arg.startsWith("--chain=")) {
      const value = arg.slice("--chain=".length);
      if (value !== "amoy" && value !== "polygon") {
        throw new Error(`Invalid --chain=${value} (use amoy|polygon)`);
      }
      chain = value;
    }
  }

  return { rpc, contract, tokenId, signature, allowIpfs, chain };
}

function createChainClient(
  rpc: string,
  chain: "amoy" | "polygon",
): PublicClient {
  return createPublicClient({
    chain: chain === "polygon" ? polygon : polygonAmoy,
    transport: http(rpc),
  });
}

function createOfflineChainReads(
  client: PublicClient,
  contract: `0x${string}`,
) {
  const abi = andromedaWorksAbi as Abi;
  return {
    async tokenURI(tokenId: bigint): Promise<string> {
      return client.readContract({
        address: contract,
        abi,
        functionName: "tokenURI",
        args: [tokenId],
      }) as Promise<string>;
    },
    async envelopeURIOfToken(tokenId: bigint): Promise<string> {
      return client.readContract({
        address: contract,
        abi,
        functionName: "envelopeURIOfToken",
        args: [tokenId],
      }) as Promise<string>;
    },
  };
}

function buildGatewaysFromEnv(): ContentGatewayBases {
  const arweave =
    process.env.ARWEAVE_GATEWAY_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_ARWEAVE_GATEWAY_BASE_URL?.trim() ||
    DEFAULT_CONTENT_GATEWAY_BASES.arweave;
  const listRaw =
    process.env.ARWEAVE_GATEWAY_URLS?.trim() ||
    process.env.NEXT_PUBLIC_ARWEAVE_GATEWAY_URLS?.trim();
  const arweaveUrls = listRaw
    ? listRaw.split(",").map((part) => part.trim().replace(/\/+$/, "")).filter(Boolean)
    : DEFAULT_CONTENT_GATEWAY_BASES.arweaveUrls;
  return {
    ipfs:
      process.env.IPFS_GATEWAY_BASE_URL?.trim() ||
      process.env.NEXT_PUBLIC_IPFS_GATEWAY_BASE_URL?.trim() ||
      DEFAULT_CONTENT_GATEWAY_BASES.ipfs,
    arweave: arweave.replace(/\/+$/, ""),
    arweaveUrls,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rpc =
    args.rpc ||
    process.env.ALCHEMY_RPC_URL?.trim() ||
    process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL?.trim() ||
    null;
  const contract =
    args.contract ||
    (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.trim() as
      | `0x${string}`
      | undefined) ||
    null;

  if (!rpc || !contract || args.tokenId === null || !args.signature) {
    throw new Error(
      [
        "Usage: pnpm reference-reader -- --rpc=<url> --contract=0x… --token-id=<n> --signature=0x…",
        `Sign message: "${READER_KEY_SIGNATURE_MESSAGE}"`,
        "Optional: --chain=amoy|polygon --allow-ipfs",
      ].join("\n"),
    );
  }

  const client = createChainClient(rpc, args.chain);
  const gateways = buildGatewaysFromEnv();

  const result = await readOfflineCopy({
    tokenId: args.tokenId,
    signature: args.signature,
    chain: createOfflineChainReads(client, contract),
    requireArweave: !args.allowIpfs,
    fetchJson: async (uri) => {
      const response = await fetchContentFromGateways({
        uriOrId: uri,
        gateways,
        init: { cache: "no-store" },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata (${response.status})`);
      }
      return response.json();
    },
    fetchBytes: (uri) =>
      fetchContentBytesFromGateways({
        uriOrId: uri,
        gateways,
        init: { cache: "no-store" },
      }),
  });

  console.error(
    JSON.stringify(
      {
        tokenId: args.tokenId.toString(),
        metadataUri: result.uris.metadataUri,
        envelopeUri: result.uris.envelopeUri,
      },
      null,
      2,
    ),
  );
  process.stdout.write(result.text);
  if (!result.text.endsWith("\n")) {
    process.stdout.write("\n");
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("reference-reader failed:", message);
  process.exit(1);
});
