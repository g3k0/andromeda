import "server-only";

import { TurboFactory, type ArweaveJWK } from "@ardrive/turbo-sdk";

import {
  parseArweaveJwk,
  type ArweaveJwk,
} from "../arweave-jwk";
import type { PermanentStoragePort } from "../ports/permanent-storage-port";
import type { TurboUploadClient } from "../ports/turbo-upload-client";
import {
  createArweaveTurboStorage,
  type ArweaveTurboStorageConfig,
} from "./arweave-turbo-storage";

export type { ArweaveJwk };
export { parseArweaveJwk };

export function createTurboUploadClientFromJwk(
  jwk: ArweaveJwk,
): TurboUploadClient {
  const turbo = TurboFactory.authenticated({
    privateKey: jwk as unknown as ArweaveJWK,
  });
  return {
    async upload({ data, dataItemOpts }) {
      const result = await turbo.upload({ data, dataItemOpts });
      return { id: result.id };
    },
  };
}

export type ArweaveTurboEnvConfig = {
  jwk: ArweaveJwk;
  gatewayBaseUrl: string;
};

export function createArweaveTurboStorageFromConfig(
  env: ArweaveTurboEnvConfig,
  overrides?: Partial<Omit<ArweaveTurboStorageConfig, "client">>,
): PermanentStoragePort {
  return createArweaveTurboStorage({
    client: createTurboUploadClientFromJwk(env.jwk),
    gatewayBaseUrl: env.gatewayBaseUrl,
    ...overrides,
  });
}
