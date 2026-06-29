import { createHash } from "node:crypto";

import { asCid, type Cid } from "./types";

/** Deterministic CID derived from content bytes (test/fake adapter). */
export function cidFromContent(content: Uint8Array): Cid {
  const digest = createHash("sha256").update(content).digest("hex");
  return asCid(`bafkbei${digest}`);
}

export function cidFromJson(value: unknown): Cid {
  const encoded = new TextEncoder().encode(JSON.stringify(value));
  return cidFromContent(encoded);
}

export function toJsonBytes(value: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(value));
}
