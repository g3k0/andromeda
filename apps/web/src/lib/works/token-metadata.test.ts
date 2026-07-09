import { describe, expect, it } from "vitest";

import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";

import { buildAcePublicMetadata } from "./publish-service";
import {
  COPY_NUMBER_TRAIT,
  EDITION_SIZE_TRAIT,
  buildTokenMetadata,
  formatCopyLabel,
} from "./token-metadata";
import { parseWorkImprintFromFormValues } from "./work-imprint-metadata";

const CONTRACT = "0x1111111111111111111111111111111111111111" as const;
const REGISTRY = "0x2222222222222222222222222222222222222222" as const;
const AUTHOR = "0xabcdef0123456789abcdef0123456789abcdef01";

function workMetadata(): AcePublicMetadata {
  return buildAcePublicMetadata({
    name: "The Star Gate",
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
        backCoverText: "An encrypted science-fiction novella.",
        aboutAuthor: "The author explores distant worlds.",
      },
      AUTHOR,
    ),
    imageUri: "ipfs://bafyCover",
    encryptedContentUri: "ipfs://bafyContent",
    chainId: 80002,
    contractAddress: CONTRACT,
    registryAddress: REGISTRY,
  });
}

function traitValue(metadata: AcePublicMetadata, trait: string) {
  return metadata.attributes?.find((a) => a.trait_type === trait)?.value;
}

describe("formatCopyLabel", () => {
  it("includes the edition size for a limited edition", () => {
    expect(formatCopyLabel(3, 10n)).toBe("Copy #3 / 10");
  });

  it("omits the edition size for an open edition", () => {
    expect(formatCopyLabel(3, 0n)).toBe("Copy #3");
  });
});

describe("buildTokenMetadata", () => {
  it("adds copy number and edition size attributes without touching the ACE block", () => {
    const work = workMetadata();
    const token = buildTokenMetadata({
      workMetadata: work,
      copyNumber: 3,
      maxCopies: 10n,
    });

    expect(token.name).toBe("The Star Gate — Copy #3 / 10");
    expect(traitValue(token, COPY_NUMBER_TRAIT)).toBe(3);
    expect(traitValue(token, EDITION_SIZE_TRAIT)).toBe("10");
    expect(token.ace).toEqual(work.ace);
    expect(token.image).toBe(work.image);
    expect(token.work_imprint).toEqual(work.work_imprint);
  });

  it("omits the edition size attribute for an open edition", () => {
    const token = buildTokenMetadata({
      workMetadata: workMetadata(),
      copyNumber: 7,
      maxCopies: 0n,
    });

    expect(token.name).toBe("The Star Gate — Copy #7");
    expect(traitValue(token, COPY_NUMBER_TRAIT)).toBe(7);
    expect(traitValue(token, EDITION_SIZE_TRAIT)).toBeUndefined();
  });

  it("is idempotent when re-applied to already-numbered metadata", () => {
    const once = buildTokenMetadata({
      workMetadata: workMetadata(),
      copyNumber: 2,
      maxCopies: 5n,
    });
    const twice = buildTokenMetadata({
      workMetadata: once,
      copyNumber: 2,
      maxCopies: 5n,
    });

    expect(twice.name).toBe("The Star Gate — Copy #2 / 5");
    expect(
      twice.attributes?.filter((a) => a.trait_type === COPY_NUMBER_TRAIT),
    ).toHaveLength(1);
  });

  it("rejects an invalid copy number", () => {
    expect(() =>
      buildTokenMetadata({ workMetadata: workMetadata(), copyNumber: 0, maxCopies: 5n }),
    ).toThrow(/positive integer/);
  });

  it("rejects a copy number beyond the edition size", () => {
    expect(() =>
      buildTokenMetadata({ workMetadata: workMetadata(), copyNumber: 6, maxCopies: 5n }),
    ).toThrow(/exceed the edition size/);
  });
});
