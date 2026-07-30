/**
 * Migrate legacy IPFS work blobs to Arweave and print a JSON report.
 *
 * Usage (from apps/web):
 *   pnpm migrate:ipfs-arweave -- --work-id=1
 *   pnpm migrate:ipfs-arweave -- --work-id=1 --out=./migration-report.json
 *
 * Requires Mongo (`MONGODB_URI`) for work/token discovery and Arweave Turbo auth
 * (`ARWEAVE_JWK`). Does **not** submit on-chain txs — the report includes
 * `suggestedOnChain` for the author wallet (`updateWorkMetadataURI`,
 * `setCopyMetadataURI`, `setCopyEnvelopeURI`).
 *
 * Decision (PR8): work-level URI is migrated via author-only
 * `updateWorkMetadataURI` (not left on IPFS forever).
 */
import { loadEnvConfig } from "@next/env";
import { writeFile } from "node:fs/promises";

import {
  createArweaveTurboStorageFromConfig,
  parseArweaveJwk,
} from "@/lib/ipfs/adapters/create-arweave-turbo-client";
import { fetchContentBytesFromGateways } from "@/lib/ipfs/content-gateway-fetch";
import {
  getArweaveTurboStorageEnvConfig,
  getContentGatewayBases,
} from "@/lib/ipfs/ipfs-config";
import { TokenModel } from "@/lib/db/models/token.model";
import { createMongoIndexerRepositories } from "@/lib/works/adapters/create-indexer-repositories";
import {
  migrateWorkToArweave,
  summarizeMigrationOrphans,
} from "@/lib/works/migrate-ipfs-to-arweave";

loadEnvConfig(process.cwd());

function parseArgs(argv: string[]): {
  workId: bigint | null;
  outPath: string | null;
} {
  let workId: bigint | null = null;
  let outPath: string | null = null;
  for (const arg of argv) {
    if (arg.startsWith("--work-id=")) {
      const raw = arg.slice("--work-id=".length);
      if (!/^\d+$/.test(raw)) {
        throw new Error(`Invalid --work-id=${raw}`);
      }
      workId = BigInt(raw);
    } else if (arg.startsWith("--out=")) {
      outPath = arg.slice("--out=".length);
    }
  }
  return { workId, outPath };
}

async function main() {
  const { workId, outPath } = parseArgs(process.argv.slice(2));
  if (workId === null) {
    throw new Error(
      "Usage: pnpm migrate:ipfs-arweave -- --work-id=<n> [--out=report.json]",
    );
  }

  const repositories = await createMongoIndexerRepositories();
  const work = await repositories.works.getWork(workId);
  if (!work) {
    throw new Error(`Work ${workId.toString()} not found in Mongo`);
  }

  const tokenDocs = await TokenModel.find({ workId: workId.toString() }).lean();
  const migrationTokens = tokenDocs.map((doc) => ({
    tokenId: BigInt(doc.tokenId),
    metadataURI: doc.metadataURI ?? null,
    envelopeCid: doc.envelopeCid ?? null,
  }));

  const gateways = getContentGatewayBases();
  const env = getArweaveTurboStorageEnvConfig();
  const storage = createArweaveTurboStorageFromConfig({
    jwk: parseArweaveJwk(env.jwkRaw),
    gatewayBaseUrl: env.gatewayBaseUrl,
    gatewayUrls: env.gatewayUrls,
  });

  const result = await migrateWorkToArweave(
    {
      workId,
      metadataUri: work.metadataURI,
      tokens: migrationTokens,
    },
    {
      fetchBytes: (uri) =>
        fetchContentBytesFromGateways({
          uriOrId: uri,
          gateways,
        }),
      uploadBlob: (data, options) => storage.uploadBlob(data, options),
      uploadJson: (data, options) => storage.uploadJson(data, options),
    },
  );

  const report = {
    workId: workId.toString(),
    author: work.author,
    generatedAt: new Date().toISOString(),
    orphans: summarizeMigrationOrphans(result.rows),
    ...result,
  };

  const json = `${JSON.stringify(report, null, 2)}\n`;
  if (outPath) {
    await writeFile(outPath, json, "utf8");
    console.log(`Wrote report to ${outPath}`);
  } else {
    console.log(json);
  }

  if (report.orphans.length > 0) {
    console.error(
      `Orphan blobs: ${report.orphans.length} (IPFS unreachable — skipped on-chain suggestion for those rows)`,
    );
    process.exitCode = 2;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("migrate-ipfs-to-arweave failed:", message);
  process.exit(1);
});
