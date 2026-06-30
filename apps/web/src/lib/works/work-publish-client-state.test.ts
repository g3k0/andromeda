import { describe, expect, it } from "vitest";

import {
  createWorkPublishClientState,
  workPublishClientReducer,
} from "./work-publish-client-state";

describe("workPublishClientReducer", () => {
  it("updates a field and clears its validation error", () => {
    const initial = {
      ...createWorkPublishClientState(),
      errors: { name: "Title is required." },
    };

    const next = workPublishClientReducer(initial, {
      type: "field_change",
      field: "name",
      value: "Novella",
    });

    expect(next.values.name).toBe("Novella");
    expect(next.errors.name).toBeUndefined();
  });

  it("marks upload success and moves to ready", () => {
    const metadata = {
      name: "Novella",
      description: "First edition, edition 1 · published 2026-06-01",
      image: "ipfs://cover",
      work_imprint: {
        publication_date: "2026-06-01",
        edition_number: 1,
        edition_kind: "first" as const,
        author_address: "0x1111111111111111111111111111111111111111",
      },
      ace: {
        version: "1" as const,
        encrypted_content: "ipfs://content",
        cipher: "aes-256-gcm" as const,
        envelope_scheme: "ecies-secp256k1" as const,
        tba_standard: "erc-6551" as const,
        chain_id: 80002,
        contract: "0x1111111111111111111111111111111111111111",
        registry: "0x2222222222222222222222222222222222222222",
      },
    };

    const next = workPublishClientReducer(createWorkPublishClientState(), {
      type: "upload_success",
      metadata,
    });

    expect(next.step).toBe("ready");
    expect(next.metadataPreview).toEqual(metadata);
  });
});
