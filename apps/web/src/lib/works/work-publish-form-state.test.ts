import { describe, expect, it } from "vitest";

import {
  createEmptyWorkPublishForm,
  formatMetadataPreview,
  hasWorkPublishFormErrors,
  parseRegisterWorkParams,
  validateWorkPublishForm,
} from "./work-publish-form-state";
import { buildAcePublicMetadata } from "./publish-service";

describe("validateWorkPublishForm", () => {
  it("requires title, description, manuscript, and cover", () => {
    const errors = validateWorkPublishForm(createEmptyWorkPublishForm(), null, null);
    expect(hasWorkPublishFormErrors(errors)).toBe(true);
    expect(errors.name).toBeTruthy();
    expect(errors.coverImage).toBeTruthy();
    expect(errors.manuscriptFile).toBeTruthy();
  });

  it("accepts a valid form", () => {
    const cover = new File([new Uint8Array([1])], "cover.png", {
      type: "image/png",
    });
    const manuscript = new File([new TextEncoder().encode("Chapter 1")], "novel.txt", {
      type: "text/plain",
    });
    const errors = validateWorkPublishForm(
      {
        ...createEmptyWorkPublishForm(),
        name: "Novella",
        description: "Encrypted story.",
        priceMatic: "0.01",
        maxCopies: "10",
      },
      cover,
      manuscript,
    );
    expect(hasWorkPublishFormErrors(errors)).toBe(false);
  });

  it("accepts a blank initial price", () => {
    const cover = new File([new Uint8Array([1])], "cover.png", {
      type: "image/png",
    });
    const manuscript = new File([new TextEncoder().encode("Chapter 1")], "novel.txt", {
      type: "text/plain",
    });
    const errors = validateWorkPublishForm(
      {
        ...createEmptyWorkPublishForm(),
        name: "Novella",
        description: "Encrypted story.",
        priceMatic: "",
        maxCopies: "10",
      },
      cover,
      manuscript,
    );
    expect(errors.priceMatic).toBeUndefined();
    expect(hasWorkPublishFormErrors(errors)).toBe(false);
  });
});

describe("parseRegisterWorkParams", () => {
  it("parses MATIC price and max copies", () => {
    const params = parseRegisterWorkParams({
      ...createEmptyWorkPublishForm(),
      priceMatic: "1",
      maxCopies: "25",
    });
    expect(params.priceWei).toBe(10n ** 18n);
    expect(params.maxCopies).toBe(25n);
  });

  it("registers with zero price when the initial price is blank", () => {
    const params = parseRegisterWorkParams({
      ...createEmptyWorkPublishForm(),
      priceMatic: "",
      maxCopies: "0",
    });
    expect(params.priceWei).toBe(0n);
  });
});

describe("formatMetadataPreview", () => {
  it("pretty prints ACE metadata JSON", () => {
    const metadata = buildAcePublicMetadata({
      name: "Novella",
      description: "Encrypted story.",
      imageUri: "ipfs://cover",
      encryptedContentUri: "ipfs://content",
      chainId: 80002,
      contractAddress: "0x1111111111111111111111111111111111111111",
      registryAddress: "0x2222222222222222222222222222222222222222",
    });

    expect(formatMetadataPreview(metadata)).toContain('"ace"');
  });
});
