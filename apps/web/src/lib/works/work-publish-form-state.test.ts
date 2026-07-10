import { describe, expect, it } from "vitest";
import { createTranslateFn } from "@/lib/i18n/translate";

import {
  createEmptyWorkPublishForm,
  formatMetadataPreview,
  hasWorkPublishFormErrors,
  parseRegisterWorkParams,
  validateWorkPublishForm,
} from "./work-publish-form-state";
import { buildAcePublicMetadata } from "./publish-service";
import { parseWorkImprintFromFormValues } from "./work-imprint-metadata";

const AUTHOR = "0xabcdef0123456789abcdef0123456789abcdef01";
const t = createTranslateFn("en");

function validPublishFormValues() {
  return {
    ...createEmptyWorkPublishForm(),
    name: "Novella",
    publicationDate: "2026-06-01",
    editionNumber: "1",
    editionKind: "first" as const,
    backCoverText: "A short encrypted novella.",
    aboutAuthor: "The author writes speculative fiction.",
  };
}

describe("validateWorkPublishForm", () => {
  it("requires title, imprint metadata, manuscript, and cover", () => {
    const errors = validateWorkPublishForm(createEmptyWorkPublishForm(), null, null, t);
    expect(hasWorkPublishFormErrors(errors)).toBe(true);
    expect(errors.name).toBeTruthy();
    expect(errors.publicationDate).toBeTruthy();
    expect(errors.backCoverText).toBeTruthy();
    expect(errors.aboutAuthor).toBeTruthy();
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
        ...validPublishFormValues(),
        priceMatic: "0.01",
        maxCopies: "10",
      },
      cover,
      manuscript,
      t,
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
        ...validPublishFormValues(),
        priceMatic: "",
        maxCopies: "10",
      },
      cover,
      manuscript,
      t,
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
      maxCopies: "25",
    });
    expect(params.priceWei).toBe(0n);
    expect(params.maxCopies).toBe(25n);
  });
});

describe("validateWorkPublishForm max copies", () => {
  it("rejects zero and over-limit max copies", () => {
    const cover = new File([new Uint8Array([1])], "cover.png", {
      type: "image/png",
    });
    const manuscript = new File([new TextEncoder().encode("Chapter 1")], "novel.txt", {
      type: "text/plain",
    });

    const zeroErrors = validateWorkPublishForm(
      {
        ...validPublishFormValues(),
        maxCopies: "0",
      },
      cover,
      manuscript,
      t,
    );
    expect(zeroErrors.maxCopies).toBe("Max copies must be at least 1.");

    const overLimitErrors = validateWorkPublishForm(
      {
        ...validPublishFormValues(),
        maxCopies: "501",
      },
      cover,
      manuscript,
      t,
    );
    expect(overLimitErrors.maxCopies).toBe("Max copies cannot exceed 500.");
  });
});

describe("formatMetadataPreview", () => {
  it("pretty prints ACE metadata JSON", () => {
    const metadata = buildAcePublicMetadata({
      name: "Novella",
      workImprint: parseWorkImprintFromFormValues(
        {
          publicationDate: "2026-06-01",
          editionNumber: "1",
          editionKind: "first",
          reprintNumber: "",
          seriesName: "",
          seriesVolume: "",
          language: "",
          originalPublicationDate: "",
          backCoverText: "Encrypted story blurb.",
          aboutAuthor: "Author bio.",
        },
        AUTHOR,
      ),
      imageUri: "ipfs://cover",
      encryptedContentUri: "ipfs://content",
      chainId: 80002,
      contractAddress: "0x1111111111111111111111111111111111111111",
      registryAddress: "0x2222222222222222222222222222222222222222",
    });

    expect(formatMetadataPreview(metadata)).toContain('"ace"');
    expect(formatMetadataPreview(metadata)).toContain('"work_imprint"');
  });
});
