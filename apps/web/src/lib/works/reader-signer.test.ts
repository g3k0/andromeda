import { describe, expect, it } from "vitest";

import { generateContentKey } from "@/lib/content-crypto/ace-spec";
import { wrapContentKey } from "@/lib/content-crypto/envelope";

import {
  createReaderSignerFromSignature,
  deriveReaderKeypairFromSignature,
} from "./reader-signer";

const SIGNATURE = ("0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8" +
  "1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac81b") as `0x${string}`;

describe("reader signer", () => {
  it("derives a deterministic keypair from a signature", () => {
    const a = deriveReaderKeypairFromSignature(SIGNATURE);
    const b = deriveReaderKeypairFromSignature(SIGNATURE);

    expect(a.privateKey).toHaveLength(32);
    expect(a.publicKey.length).toBeGreaterThan(32);
    expect(Buffer.from(a.privateKey).toString("hex")).toBe(
      Buffer.from(b.privateKey).toString("hex"),
    );
  });

  it("unwraps an envelope wrapped to the derived public key", async () => {
    const { publicKey } = deriveReaderKeypairFromSignature(SIGNATURE);
    const contentKey = generateContentKey();
    const envelope = wrapContentKey(contentKey, publicKey);

    const signer = createReaderSignerFromSignature(SIGNATURE);
    const unwrapped = await signer.unwrapEnvelope(envelope);

    expect(Buffer.from(unwrapped).toString("hex")).toBe(
      Buffer.from(contentKey).toString("hex"),
    );
  });
});
