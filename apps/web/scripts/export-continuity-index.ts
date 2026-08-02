/**
 * Export a continuity URI index (works/tokens → ar:// / legacy ipfs://) to Arweave.
 *
 * Usage (from apps/web):
 *   pnpm export:continuity-index
 *   pnpm export:continuity-index -- --out=./continuity-index.json --dry-run
 *
 * Requires Mongo (`MONGODB_URI`). Upload requires `ARWEAVE_JWK` unless `--dry-run`.
 */
import { loadEnvConfig } from "@next/env";
import { writeFile } from "node:fs/promises";

import {
  createArweaveTurboStorageFromConfig,
  parseArweaveJwk,
} from "@/lib/ipfs/adapters/create-arweave-turbo-client";
import { getArweaveTurboStorageEnvConfig } from "@/lib/ipfs/ipfs-config";
import { TokenModel } from "@/lib/db/models/token.model";
import { createMongoIndexerRepositories } from "@/lib/works/adapters/create-indexer-repositories";
import { buildContinuityIndex } from "@/lib/works/continuity-export";
import type { TokenRecord } from "@/lib/works/types";
import { getAddress } from "viem";

loadEnvConfig(process.cwd());

function parseArgs(argv: string[]): {
  outPath: string | null;
  dryRun: boolean;
} {
  let outPath: string | null = null;
  let dryRun = false;
  for (const arg of argv) {
    if (arg.startsWith("--out=")) {
      outPath = arg.slice("--out=".length);
    } else if (arg === "--dry-run") {
      dryRun = true;
    }
  }
  return { outPath, dryRun };
}

function toTokenRecord(doc: {
  tokenId: string;
  workId: string;
  owner: string;
  copyNumber?: number | null;
  tbaAddress?: string | null;
  envelopeCid?: string | null;
  envelopeRecipientPublicKey?: string | null;
  metadataURI?: string | null;
  createdAt: Date;
  updatedAt: Date;
}): TokenRecord {
  return {
    tokenId: BigInt(doc.tokenId),
    workId: BigInt(doc.workId),
    owner: getAddress(doc.owner),
    copyNumber: doc.copyNumber ?? null,
    tbaAddress: doc.tbaAddress
      ? (getAddress(doc.tbaAddress) as `0x${string}`)
      : null,
    envelopeCid: doc.envelopeCid ?? null,
    envelopeRecipientPublicKey: doc.envelopeRecipientPublicKey ?? null,
    metadataURI: doc.metadataURI ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

async function main() {
  const { outPath, dryRun } = parseArgs(process.argv.slice(2));
  const repositories = await createMongoIndexerRepositories();
  const works = await repositories.works.listWorks();
  const tokenDocs = await TokenModel.find({}).lean();
  const tokens = tokenDocs.map((doc) => toTokenRecord(doc));

  const chainEnv = process.env.NEXT_PUBLIC_CHAIN?.trim().toLowerCase();
  const chainId =
    chainEnv === "polygon" ? 137 : chainEnv === "amoy" ? 80002 : undefined;
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS?.trim();

  const index = buildContinuityIndex({
    works,
    tokens,
    chainId,
    contractAddress: contractAddress || undefined,
  });

  const json = `${JSON.stringify(index, null, 2)}\n`;
  if (outPath) {
    await writeFile(outPath, json, "utf8");
    console.log(`Wrote local index to ${outPath}`);
  }

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          dryRun: true,
          works: index.works.length,
          tokens: tokens.length,
        },
        null,
        2,
      ),
    );
    return;
  }

  const env = getArweaveTurboStorageEnvConfig();
  const storage = createArweaveTurboStorageFromConfig({
    jwk: parseArweaveJwk(env.jwkRaw),
    gatewayBaseUrl: env.gatewayBaseUrl,
    gatewayUrls: env.gatewayUrls,
  });

  const uploaded = await storage.uploadJson(index, {
    name: "andromeda-continuity-index.json",
  });

  console.log(
    JSON.stringify(
      {
        uri: uploaded.uri,
        gateway: storage.toGatewayUrl(uploaded.uri),
        works: index.works.length,
        tokens: tokens.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("export-continuity-index failed:", message);
  process.exit(1);
});
