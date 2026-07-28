import { parseEventLogs, zeroAddress, type Log } from "viem";

import { andromedaWorksAbi } from "@/lib/chain/contract";
import type { IndexerRepositories } from "@/lib/works/ports/work-repository";

export type AndromedaChainEvent =
  | {
      kind: "WorkRegistered";
      workId: bigint;
      author: `0x${string}`;
      metadataURI: string;
      price: bigint;
      maxCopies: bigint;
    }
  | { kind: "WorkStatusChanged"; workId: bigint; active: boolean }
  | {
      kind: "CopyMinted";
      workId: bigint;
      tokenId: bigint;
      recipient: `0x${string}`;
      copyNumber: bigint;
    }
  | {
      kind: "CopyPurchased";
      workId: bigint;
      tokenId: bigint;
      buyer: `0x${string}`;
    }
  | {
      kind: "CopyMetadataUpdated";
      tokenId: bigint;
      metadataURI: string;
    }
  | {
      kind: "CopyEnvelopeUpdated";
      tokenId: bigint;
      envelopeURI: string;
    }
  | {
      kind: "Transfer";
      from: `0x${string}`;
      to: `0x${string}`;
      tokenId: bigint;
    };

export type OrderedChainEvent = {
  event: AndromedaChainEvent;
  blockNumber: bigint;
  logIndex: number;
};

const INDEXED_EVENT_NAMES = [
  "WorkRegistered",
  "WorkStatusChanged",
  "CopyMinted",
  "CopyPurchased",
  "CopyMetadataUpdated",
  "CopyEnvelopeUpdated",
  "Transfer",
] as const;

type DecodedArgs = Record<string, unknown>;

function toEvent(eventName: string, args: DecodedArgs): AndromedaChainEvent | null {
  switch (eventName) {
    case "WorkRegistered":
      return {
        kind: "WorkRegistered",
        workId: args.workId as bigint,
        author: args.author as `0x${string}`,
        metadataURI: args.metadataURI as string,
        price: args.price as bigint,
        maxCopies: args.maxCopies as bigint,
      };
    case "WorkStatusChanged":
      return {
        kind: "WorkStatusChanged",
        workId: args.workId as bigint,
        active: args.active as boolean,
      };
    case "CopyMinted":
      return {
        kind: "CopyMinted",
        workId: args.workId as bigint,
        tokenId: args.tokenId as bigint,
        recipient: args.recipient as `0x${string}`,
        copyNumber: args.copyNumber as bigint,
      };
    case "CopyPurchased":
      return {
        kind: "CopyPurchased",
        workId: args.workId as bigint,
        tokenId: args.tokenId as bigint,
        buyer: args.buyer as `0x${string}`,
      };
    case "CopyMetadataUpdated":
      return {
        kind: "CopyMetadataUpdated",
        tokenId: args.tokenId as bigint,
        metadataURI: args.metadataURI as string,
      };
    case "CopyEnvelopeUpdated":
      return {
        kind: "CopyEnvelopeUpdated",
        tokenId: args.tokenId as bigint,
        envelopeURI: args.envelopeURI as string,
      };
    case "Transfer":
      return {
        kind: "Transfer",
        from: args.from as `0x${string}`,
        to: args.to as `0x${string}`,
        tokenId: args.tokenId as bigint,
      };
    default:
      return null;
  }
}

/** Decodes AndromedaWorks logs into typed events ordered by (block, logIndex). */
export function decodeAndromedaEvents(
  logs: readonly Log[],
): OrderedChainEvent[] {
  const parsed = parseEventLogs({
    abi: andromedaWorksAbi,
    eventName: [...INDEXED_EVENT_NAMES],
    logs: [...logs],
  });

  const events: OrderedChainEvent[] = [];
  for (const log of parsed) {
    const event = toEvent(log.eventName, log.args as DecodedArgs);
    if (!event) {
      continue;
    }
    events.push({
      event,
      blockNumber: log.blockNumber ?? 0n,
      logIndex: log.logIndex ?? 0,
    });
  }

  return events.sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) {
      return a.blockNumber < b.blockNumber ? -1 : 1;
    }
    return a.logIndex - b.logIndex;
  });
}

async function applyEvent(
  repositories: IndexerRepositories,
  event: AndromedaChainEvent,
  onWorkRegistered?: (metadataURI: string, workId: string) => Promise<void>,
): Promise<void> {
  switch (event.kind) {
    case "WorkRegistered":
      await repositories.works.upsertWork({
        workId: event.workId,
        author: event.author,
        metadataURI: event.metadataURI,
        price: event.price,
        maxCopies: event.maxCopies,
        active: true,
      });
      if (onWorkRegistered) {
        try {
          await onWorkRegistered(event.metadataURI, event.workId.toString());
        } catch {
          // Upload metadata persistence is best-effort for the indexer path.
        }
      }
      return;
    case "WorkStatusChanged":
      await repositories.works.setActive(event.workId, event.active);
      return;
    case "CopyMinted": {
      const existing = await repositories.tokens.getToken(event.tokenId);
      if (existing) {
        return; // idempotent: copy already projected
      }
      const work = await repositories.works.getWork(event.workId);
      const copyNumber = Number(event.copyNumber);
      if (!Number.isInteger(copyNumber) || copyNumber < 1) {
        return;
      }
      await repositories.tokens.upsertToken({
        tokenId: event.tokenId,
        workId: event.workId,
        owner: event.recipient,
        copyNumber,
      });
      const minted = work?.minted ?? 0n;
      if (BigInt(copyNumber) > minted) {
        await repositories.works.setMinted(event.workId, BigInt(copyNumber));
      }
      return;
    }
    case "CopyPurchased": {
      const existing = await repositories.tokens.getToken(event.tokenId);
      if (existing?.owner.toLowerCase() === event.buyer.toLowerCase()) {
        return;
      }
      await repositories.tokens.upsertToken({
        tokenId: event.tokenId,
        workId: event.workId,
        owner: event.buyer,
      });
      await repositories.works.decrementPrimarySaleRemaining(event.workId);
      return;
    }
    case "CopyMetadataUpdated":
      await repositories.tokens.setMetadataURI(event.tokenId, event.metadataURI);
      return;
    case "CopyEnvelopeUpdated":
      await repositories.tokens.setEnvelopeCid(event.tokenId, event.envelopeURI);
      return;
    case "Transfer":
      if (event.from === zeroAddress) {
        return; // mint transfer handled by CopyMinted
      }
      await repositories.tokens.setOwner(event.tokenId, event.to);
      return;
  }
}

export type HandleChainLogsResult = {
  processed: number;
};

export type HandleChainLogsOptions = {
  onWorkRegistered?: (metadataURI: string, workId: string) => Promise<void>;
};

/** Applies decoded AndromedaWorks logs to the projection repositories (idempotent). */
export async function handleChainLogs(
  repositories: IndexerRepositories,
  logs: readonly Log[],
  options: HandleChainLogsOptions = {},
): Promise<HandleChainLogsResult> {
  const ordered = decodeAndromedaEvents(logs);
  await ordered.reduce(
    (chain, { event }) =>
      chain.then(() => applyEvent(repositories, event, options.onWorkRegistered)),
    Promise.resolve(),
  );
  return { processed: ordered.length };
}
