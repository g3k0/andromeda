/**
 * Poll AndromedaWorks events and project them into MongoDB.
 *
 * Usage (from apps/web):
 *   pnpm exec tsx scripts/sync-chain-events.ts
 *
 * Requires CHAIN_INDEXER_ENABLED=true, plus MONGODB_URI and ALCHEMY_RPC_URL.
 * Optionally set CHAIN_INDEXER_START_BLOCK to the contract deployment block.
 */
import { loadEnvConfig } from "@next/env";

import { createAndromedaPublicClient } from "@/lib/chain/public-client";
import {
  getChainIndexerStartBlock,
  isChainIndexerEnabled,
} from "@/lib/config/env";
import { createMongoIndexerRepositories } from "@/lib/works/adapters/create-indexer-repositories";
import { syncChainEvents } from "@/lib/indexer/chain-indexer";
import { markWorkUploadRegistered } from "@/lib/works/work-upload-indexer-hook";

loadEnvConfig(process.cwd());

async function main() {
  if (!isChainIndexerEnabled()) {
    console.log("Chain indexer disabled (set CHAIN_INDEXER_ENABLED=true).");
    process.exit(0);
  }

  const client = createAndromedaPublicClient();
  const repositories = await createMongoIndexerRepositories();

  const result = await syncChainEvents(client, repositories, {
    startBlock: getChainIndexerStartBlock(),
    onWorkRegistered: markWorkUploadRegistered,
  });

  if (result.processedRanges === 0) {
    console.log("No new blocks to index.");
  } else {
    console.log(
      `Indexed ${result.processedEvents} event(s) across blocks ` +
        `${result.fromBlock}-${result.toBlock} (${result.processedRanges} range(s)).`,
    );
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
