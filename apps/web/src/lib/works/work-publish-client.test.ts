import { describe, expect, it, vi } from "vitest";

import { uploadWorkPublishPayload } from "./work-publish-client";
import { createEmptyWorkPublishForm } from "./work-publish-form-state";

describe("uploadWorkPublishPayload", () => {
  it("encrypts locally and uploads multipart payload", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        metadataUri: "ipfs://bafyMetadata",
        metadata: {
          name: "Novella",
          description: "Encrypted story.",
          image: "ipfs://cover",
          ace: {
            version: "1",
            encrypted_content: "ipfs://content",
            cipher: "aes-256-gcm",
            envelope_scheme: "ecies-secp256k1",
            tba_standard: "erc-6551",
            chain_id: 80002,
            contract: "0x1111111111111111111111111111111111111111",
            registry: "0x2222222222222222222222222222222222222222",
          },
        },
      }),
    );

    const cover = new File([new Uint8Array([1])], "cover.png", {
      type: "image/png",
    });
    const manuscript = new File([new TextEncoder().encode("Chapter 1")], "novel.txt", {
      type: "text/plain",
    });

    const result = await uploadWorkPublishPayload(
      {
        values: {
          ...createEmptyWorkPublishForm(),
          name: "Novella",
          description: "Encrypted story.",
        },
        coverImage: cover,
        manuscriptFile: manuscript,
        walletAuth: {
          address: "0x1111111111111111111111111111111111111111",
          message: "Sign in",
          signature: `0x${"b".repeat(130)}`,
        },
      },
      fetchImpl,
    );

    expect(result.metadataUri).toBe("ipfs://bafyMetadata");
    expect(result.contentKey).toHaveLength(32);
    expect(fetchImpl).toHaveBeenCalledOnce();
    const init = (fetchImpl.mock.calls[0] as unknown as [string, RequestInit] | undefined)?.[1];
    expect(init?.body).toBeInstanceOf(FormData);
    const formData = init!.body as FormData;
    expect(formData.get("walletAuth")).toContain("0x1111");
    expect(formData.has("contentKey")).toBe(false);
  });
});
