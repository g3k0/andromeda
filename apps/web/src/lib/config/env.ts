import "server-only";

import { z } from "zod";

function optionalPositiveInt(value: string | undefined): number | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

const serverEnvSchema = z.object({
  NODE_ENV: z.string().optional(),
  MONGODB_URI: z.string().optional(),
  ADMIN_ADDRESSES: z.string().optional(),
  TRUST_PROXY: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  WALLET_SESSION_TTL_MINUTES: z
    .string()
    .optional()
    .transform(optionalPositiveInt),
  WALLET_BINDING_TTL_HOURS: z
    .string()
    .optional()
    .transform(optionalPositiveInt),
  WALLET_AUTH_NONCE_TTL_MINUTES: z
    .string()
    .optional()
    .transform(optionalPositiveInt),
  RATE_LIMIT_MAX_REQUESTS: z.string().optional().transform(optionalPositiveInt),
  RATE_LIMIT_WINDOW_MS: z.string().optional().transform(optionalPositiveInt),
  AUTH_MESSAGE_RATE_LIMIT: z.string().optional().transform(optionalPositiveInt),
  WORK_UPLOAD_IP_RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .optional()
    .transform(optionalPositiveInt),
  WORK_UPLOAD_IP_RATE_LIMIT_WINDOW_MS: z
    .string()
    .optional()
    .transform(optionalPositiveInt),
  WORK_UPLOAD_WALLET_RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .optional()
    .transform(optionalPositiveInt),
  WORK_UPLOAD_WALLET_RATE_LIMIT_WINDOW_MS: z
    .string()
    .optional()
    .transform(optionalPositiveInt),
  CHAIN_INDEXER_ENABLED: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  CHAIN_INDEXER_START_BLOCK: z
    .string()
    .optional()
    .transform(optionalPositiveInt),
  ALCHEMY_NOTIFY_SIGNING_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (!cachedEnv) {
    cachedEnv = serverEnvSchema.parse(process.env);
  }

  return cachedEnv;
}

/** @internal */
export function resetServerEnvForTests(): void {
  cachedEnv = null;
}

export function getMongoDbUri(): string | undefined {
  return getServerEnv().MONGODB_URI;
}

export function isTrustProxyEnabled(): boolean {
  return getServerEnv().TRUST_PROXY ?? false;
}

export function getAdminAddressesRaw(): string | undefined {
  return getServerEnv().ADMIN_ADDRESSES;
}

export function isChainIndexerEnabled(): boolean {
  return getServerEnv().CHAIN_INDEXER_ENABLED ?? false;
}

export function getChainIndexerStartBlock(): bigint | undefined {
  const startBlock = getServerEnv().CHAIN_INDEXER_START_BLOCK;
  return startBlock !== undefined ? BigInt(startBlock) : undefined;
}

export function getAlchemyNotifySigningKey(): string | undefined {
  const key = getServerEnv().ALCHEMY_NOTIFY_SIGNING_KEY?.trim();
  return key ? key : undefined;
}
