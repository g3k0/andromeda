import { getAddress, type Log } from "viem";
import { z } from "zod";

const hexSchema = z.string().regex(/^0x[0-9a-fA-F]*$/);
const addressSchema = z.string().regex(/^0x[0-9a-fA-F]{40}$/);

const alchemyLogSchema = z.object({
  data: hexSchema,
  topics: z.array(hexSchema),
  index: z.number().int().nonnegative().optional(),
  account: z.object({ address: addressSchema }),
  transaction: z
    .object({
      hash: hexSchema.optional(),
      index: z.number().int().nonnegative().optional(),
    })
    .optional(),
});

const alchemyBlockSchema = z.object({
  hash: hexSchema.optional(),
  number: z.number().int().nonnegative().optional(),
  logs: z.array(alchemyLogSchema).default([]),
});

export const alchemyWebhookPayloadSchema = z.object({
  event: z.object({
    data: z.object({
      block: alchemyBlockSchema,
    }),
  }),
});

export type AlchemyWebhookPayload = z.infer<typeof alchemyWebhookPayloadSchema>;

/**
 * Extracts EVM logs from an Alchemy Notify (GraphQL) webhook payload and maps
 * them to viem `Log` objects consumable by the chain event handler.
 * Returns an empty array for payloads that don't match the expected shape.
 */
export function extractLogsFromAlchemyPayload(payload: unknown): Log[] {
  const parsed = alchemyWebhookPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    return [];
  }

  const block = parsed.data.event.data.block;
  const blockNumber = block.number !== undefined ? BigInt(block.number) : 0n;
  const blockHash = (block.hash ?? null) as `0x${string}` | null;

  return block.logs.map((log, position) => {
    return {
      address: getAddress(log.account.address),
      topics: log.topics as [] | [`0x${string}`, ...`0x${string}`[]],
      data: log.data as `0x${string}`,
      blockNumber,
      blockHash,
      logIndex: log.index ?? position,
      transactionHash: (log.transaction?.hash ?? null) as `0x${string}` | null,
      transactionIndex: log.transaction?.index ?? 0,
      removed: false,
    } satisfies Log;
  });
}
