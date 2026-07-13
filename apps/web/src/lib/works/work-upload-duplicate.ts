import type { WorkImprintMetadata } from "@/lib/ipfs/metadata-schema";

import { WorkUploadDuplicateError } from "./errors";
import type { WorkUploadRecord } from "./types";

export type WorkUploadDuplicateCandidate = {
  name: string;
  workImprint: WorkImprintMetadata;
};

/** Normalizes a work title for duplicate comparison. */
export function normalizeWorkTitle(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/** Builds a stable edition identity within the same work title. */
export function buildWorkEditionIdentity(imprint: WorkImprintMetadata): string {
  if (imprint.edition_kind === "reprint") {
    return `edition:${imprint.edition_number}:reprint:${imprint.reprint_number}`;
  }
  return `edition:${imprint.edition_number}:first`;
}

/**
 * Returns the first conflicting upload for the same author, if any.
 * Same-title first editions are rejected when a prior upload exists.
 * Reprints are allowed, except for an identical reprint slot.
 */
export function findDuplicateWorkUpload(
  existing: readonly WorkUploadRecord[],
  candidate: WorkUploadDuplicateCandidate,
): WorkUploadRecord | null {
  const title = normalizeWorkTitle(candidate.name);
  const sameTitleUploads = existing.filter(
    (record) => normalizeWorkTitle(record.name) === title,
  );

  if (sameTitleUploads.length === 0) {
    return null;
  }

  if (candidate.workImprint.edition_kind === "first") {
    return sameTitleUploads[0] ?? null;
  }

  const candidateIdentity = buildWorkEditionIdentity(candidate.workImprint);
  return (
    sameTitleUploads.find(
      (record) => buildWorkEditionIdentity(record.workImprint) === candidateIdentity,
    ) ?? null
  );
}

export function assertNoDuplicateWorkUpload(
  existing: readonly WorkUploadRecord[],
  candidate: WorkUploadDuplicateCandidate,
): void {
  const duplicate = findDuplicateWorkUpload(existing, candidate);
  if (duplicate) {
    throw new WorkUploadDuplicateError(candidate.name);
  }
}
