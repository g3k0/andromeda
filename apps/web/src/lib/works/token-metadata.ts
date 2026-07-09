import {
  parseAcePublicMetadata,
  type AcePublicMetadata,
} from "@/lib/ipfs/metadata-schema";

import type { WorkAttribute } from "./types";

/** OpenSea/wallet trait carrying the sequential copy number of a numbered edition. */
export const COPY_NUMBER_TRAIT = "Copy number";
/** OpenSea/wallet trait carrying the total edition size (omitted for open editions). */
export const EDITION_SIZE_TRAIT = "Edition size";

/** Suffix appended to a token's name, e.g. `Copy #3 / 10` (or `Copy #3` when open). */
const COPY_LABEL_SUFFIX_PATTERN = / — Copy #\d+(?: \/ \d+)?$/;

/** Human label for a numbered edition copy — `Copy #3 / 10`, or `Copy #3` when open. */
export function formatCopyLabel(copyNumber: number, maxCopies: bigint): string {
  const suffix = maxCopies > 0n ? ` / ${maxCopies.toString()}` : "";
  return `Copy #${copyNumber}${suffix}`;
}

export type BuildTokenMetadataInput = {
  /** Public ACE metadata of the work (shared ciphertext/envelope block). */
  workMetadata: AcePublicMetadata;
  /** 1-based position of this copy within the edition. */
  copyNumber: number;
  /** Total edition size; `0` denotes an open (unlimited) edition. */
  maxCopies: bigint;
};

/**
 * Derives per-token ACE metadata for a numbered edition. Only the display name
 * and the `Copy #n/N` attributes change — the `ace` block (ciphertext, envelope
 * scheme, chain binding) is copied verbatim so the encryption model is invariant.
 */
export function buildTokenMetadata(
  input: BuildTokenMetadataInput,
): AcePublicMetadata {
  const { workMetadata, copyNumber, maxCopies } = input;

  if (!Number.isInteger(copyNumber) || copyNumber < 1) {
    throw new Error("copyNumber must be a positive integer");
  }
  if (maxCopies < 0n) {
    throw new Error("maxCopies must be non-negative");
  }
  if (maxCopies > 0n && BigInt(copyNumber) > maxCopies) {
    throw new Error("copyNumber cannot exceed the edition size");
  }

  const baseAttributes = (workMetadata.attributes ?? []).filter(
    (attribute) =>
      attribute.trait_type !== COPY_NUMBER_TRAIT &&
      attribute.trait_type !== EDITION_SIZE_TRAIT,
  );

  const copyAttributes: WorkAttribute[] = [
    { trait_type: COPY_NUMBER_TRAIT, value: copyNumber },
  ];
  if (maxCopies > 0n) {
    copyAttributes.push({
      trait_type: EDITION_SIZE_TRAIT,
      value: maxCopies.toString(),
    });
  }

  const baseName = workMetadata.name.replace(COPY_LABEL_SUFFIX_PATTERN, "");

  return parseAcePublicMetadata({
    ...workMetadata,
    name: `${baseName} — ${formatCopyLabel(copyNumber, maxCopies)}`,
    attributes: [...baseAttributes, ...copyAttributes],
  });
}
