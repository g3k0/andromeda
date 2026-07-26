/**
 * Smoke-test Arweave Turbo uploads end-to-end.
 *
 * Usage (from apps/web):
 *   pnpm exec tsx scripts/arweave-turbo-smoke.ts
 *
 * Requires:
 *   PERMANENT_STORAGE_BACKEND=arweave
 *   ARWEAVE_JWK='{"kty":"RSA",...}'
 * Optional:
 *   ARWEAVE_GATEWAY_BASE_URL (default https://arweave.net)
 */
import { loadEnvConfig } from "@next/env";

import {
  createArweaveTurboStorageFromConfig,
  parseArweaveJwk,
} from "@/lib/ipfs/adapters/create-arweave-turbo-client";
import { getArweaveTurboStorageEnvConfig } from "@/lib/ipfs/ipfs-config";

loadEnvConfig(process.cwd());

async function main() {
  const env = getArweaveTurboStorageEnvConfig();
  const storage = createArweaveTurboStorageFromConfig({
    jwk: parseArweaveJwk(env.jwkRaw),
    gatewayBaseUrl: env.gatewayBaseUrl,
  });

  const payload = {
    smoke: true,
    app: "Andromeda",
    at: new Date().toISOString(),
  };

  console.log("Uploading smoke JSON via Turbo…");
  const uploaded = await storage.uploadJson(payload, {
    name: "andromeda-arweave-smoke.json",
  });
  console.log("Uploaded:", uploaded.uri);
  console.log("Gateway:", storage.toGatewayUrl(uploaded.uri));

  if (!storage.fetchBytes) {
    throw new Error("fetchBytes is not implemented on this storage backend");
  }

  console.log("Fetching bytes from gateway…");
  const bytes = await storage.fetchBytes(uploaded.uri);
  const text = new TextDecoder().decode(bytes);
  const parsed = JSON.parse(text) as typeof payload;

  if (parsed.app !== "Andromeda" || parsed.smoke !== true) {
    throw new Error(`Unexpected payload from gateway: ${text}`);
  }

  console.log("Smoke OK — gateway returned the uploaded JSON.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Arweave Turbo smoke failed:", message);
  process.exit(1);
});
