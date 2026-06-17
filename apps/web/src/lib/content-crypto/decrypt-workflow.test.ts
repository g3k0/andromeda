import { describe, expect, it } from "vitest";

import { generateContentKey } from "./ace-spec";
import {
  decodeUtf8Plaintext,
  encryptContent,
  encodeUtf8Plaintext,
} from "./content-cipher";
import { decryptWorkContent } from "./decrypt-workflow";
import { wrapContentKey } from "./envelope";
import { createPrivateKeyTbaEnvelopeSigner } from "./testing/fake-tba-envelope-signer";
import { createTbaKeyFixture } from "./testing/key-fixtures";

describe("decrypt workflow", () => {
  it("decrypts work content end-to-end: encrypt → wrap → unwrap → decrypt", async () => {
    const plaintext = encodeUtf8Plaintext(
      "Chapter one — the stars over Amoy.",
    );
    const contentKey = generateContentKey();
    const tbaKeys = createTbaKeyFixture();

    const ciphertext = await encryptContent(plaintext, contentKey);
    const envelope = wrapContentKey(contentKey, tbaKeys.publicKey);
    const tbaSigner = createPrivateKeyTbaEnvelopeSigner(tbaKeys.privateKey);

    const decrypted = await decryptWorkContent({
      ciphertext,
      envelope,
      tbaSigner,
    });

    expect(decodeUtf8Plaintext(decrypted)).toBe(
      "Chapter one — the stars over Amoy.",
    );
  });

  it("fails when the signer cannot unwrap the envelope", async () => {
    const contentKey = generateContentKey();
    const ownerKeys = createTbaKeyFixture();
    const otherKeys = createTbaKeyFixture();

    const ciphertext = await encryptContent(
      encodeUtf8Plaintext("secret"),
      contentKey,
    );
    const envelope = wrapContentKey(contentKey, ownerKeys.publicKey);
    const wrongSigner = createPrivateKeyTbaEnvelopeSigner(otherKeys.privateKey);

    await expect(
      decryptWorkContent({ ciphertext, envelope, tbaSigner: wrongSigner }),
    ).rejects.toThrow();
  });
});
