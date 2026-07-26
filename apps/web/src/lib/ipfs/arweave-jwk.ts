import { IpfsConfigError } from "./errors";

/** Arweave JWK shape accepted by Turbo (`privateKey`). */
export type ArweaveJwk = Record<string, unknown>;

export function parseArweaveJwk(raw: string): ArweaveJwk {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new IpfsConfigError("ARWEAVE_JWK must be valid JSON");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new IpfsConfigError("ARWEAVE_JWK must be a JSON object (JWK)");
  }
  const jwk = parsed as ArweaveJwk;
  if (typeof jwk.kty !== "string" || !jwk.kty.trim()) {
    throw new IpfsConfigError('ARWEAVE_JWK must include a string "kty" field');
  }
  return jwk;
}
