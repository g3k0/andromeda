import type { WorkImprintMetadata } from "@/lib/ipfs/metadata-schema";
import { workImprintMetadataSchema } from "@/lib/ipfs/metadata-schema";

import { containsUnsafeControlCharacters } from "./work-publish-field-validation";

export type { WorkImprintMetadata } from "@/lib/ipfs/metadata-schema";
export { workImprintMetadataSchema } from "@/lib/ipfs/metadata-schema";

export const WORK_PUBLISH_SERIES_NAME_MAX_LENGTH = 120;
export const WORK_PUBLISH_LANGUAGE_MAX_LENGTH = 32;

export type WorkEditionKind = WorkImprintMetadata["edition_kind"];

export type WorkPublishImprintFormValues = {
  publicationDate: string;
  editionNumber: string;
  editionKind: WorkEditionKind;
  reprintNumber: string;
  seriesName: string;
  seriesVolume: string;
  language: string;
  originalPublicationDate: string;
};

export type WorkPublishImprintFormErrors = Partial<
  Record<keyof WorkPublishImprintFormValues, string>
>;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function parseOptionalPositiveInteger(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return Number.NaN;
  }
  return parsed;
}

function validateOptionalIsoDate(value: string, label: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (!ISO_DATE_PATTERN.test(trimmed)) {
    return `${label} must use YYYY-MM-DD.`;
  }
  if (Number.isNaN(Date.parse(`${trimmed}T00:00:00.000Z`))) {
    return `${label} is not a valid date.`;
  }
  return null;
}

function validateOptionalTextField(
  value: string,
  label: string,
  maxLength: number,
): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > maxLength) {
    return `${label} must be ${maxLength} characters or fewer.`;
  }
  if (containsUnsafeControlCharacters(trimmed)) {
    return `${label} contains invalid characters.`;
  }
  return null;
}

export function validateWorkPublishImprintForm(
  values: WorkPublishImprintFormValues,
): WorkPublishImprintFormErrors {
  const errors: WorkPublishImprintFormErrors = {};

  const publicationDateError = validateOptionalIsoDate(
    values.publicationDate,
    "Publication date",
  );
  if (!values.publicationDate.trim()) {
    errors.publicationDate = "Publication date is required.";
  } else if (publicationDateError) {
    errors.publicationDate = publicationDateError;
  }

  const editionNumber = parseOptionalPositiveInteger(values.editionNumber);
  if (!values.editionNumber.trim()) {
    errors.editionNumber = "Edition number is required.";
  } else if (Number.isNaN(editionNumber)) {
    errors.editionNumber = "Edition number must be a whole number of at least 1.";
  }

  if (values.editionKind !== "first" && values.editionKind !== "reprint") {
    errors.editionKind = "Select first edition or reprint.";
  }

  if (values.editionKind === "reprint") {
    const reprintNumber = parseOptionalPositiveInteger(values.reprintNumber);
    if (!values.reprintNumber.trim()) {
      errors.reprintNumber = "Reprint number is required.";
    } else if (Number.isNaN(reprintNumber)) {
      errors.reprintNumber = "Reprint number must be a whole number of at least 1.";
    }
  }

  const seriesNameError = validateOptionalTextField(
    values.seriesName,
    "Series name",
    WORK_PUBLISH_SERIES_NAME_MAX_LENGTH,
  );
  if (seriesNameError) {
    errors.seriesName = seriesNameError;
  }

  if (values.seriesName.trim()) {
    const seriesVolume = parseOptionalPositiveInteger(values.seriesVolume);
    if (!values.seriesVolume.trim()) {
      errors.seriesVolume = "Series volume is required when a series is specified.";
    } else if (Number.isNaN(seriesVolume)) {
      errors.seriesVolume = "Series volume must be a whole number of at least 1.";
    }
  } else if (values.seriesVolume.trim()) {
    errors.seriesVolume = "Series volume requires a series name.";
  }

  const languageError = validateOptionalTextField(
    values.language,
    "Language",
    WORK_PUBLISH_LANGUAGE_MAX_LENGTH,
  );
  if (languageError) {
    errors.language = languageError;
  }

  const originalPublicationDateError = validateOptionalIsoDate(
    values.originalPublicationDate,
    "Original publication date",
  );
  if (originalPublicationDateError) {
    errors.originalPublicationDate = originalPublicationDateError;
  }

  return errors;
}

export function parseWorkImprintFromFormValues(
  values: WorkPublishImprintFormValues,
  authorAddress: string,
): WorkImprintMetadata {
  const imprint = {
    publication_date: values.publicationDate.trim(),
    edition_number: Number(values.editionNumber.trim()),
    edition_kind: values.editionKind,
    reprint_number:
      values.editionKind === "reprint"
        ? Number(values.reprintNumber.trim())
        : undefined,
    series_name: values.seriesName.trim() || undefined,
    series_volume: values.seriesName.trim()
      ? Number(values.seriesVolume.trim())
      : undefined,
    language: values.language.trim() || undefined,
    original_publication_date: values.originalPublicationDate.trim() || undefined,
    author_address: authorAddress,
  };

  return workImprintMetadataSchema.parse(imprint);
}

export function buildWorkDescriptionFromImprint(
  imprint: WorkImprintMetadata,
): string {
  const parts: string[] = [];

  if (imprint.edition_kind === "first") {
    parts.push(`First edition, edition ${imprint.edition_number}`);
  } else {
    parts.push(
      `Reprint ${imprint.reprint_number}, edition ${imprint.edition_number}`,
    );
  }

  parts.push(`published ${imprint.publication_date}`);

  if (imprint.original_publication_date) {
    parts.push(`originally published ${imprint.original_publication_date}`);
  }

  if (imprint.series_name) {
    parts.push(`Vol. ${imprint.series_volume} of ${imprint.series_name}`);
  }

  if (imprint.language) {
    parts.push(`Language: ${imprint.language}`);
  }

  parts.push(`Author: ${imprint.author_address}`);

  return parts.join(" · ");
}

export function workImprintToAttributes(
  imprint: WorkImprintMetadata,
): Array<{ trait_type: string; value: string | number }> {
  const attributes: Array<{ trait_type: string; value: string | number }> = [
    { trait_type: "Publication date", value: imprint.publication_date },
    { trait_type: "Edition number", value: imprint.edition_number },
    {
      trait_type: "Edition kind",
      value: imprint.edition_kind === "first" ? "First edition" : "Reprint",
    },
    { trait_type: "Author address", value: imprint.author_address },
  ];

  if (imprint.reprint_number !== undefined) {
    attributes.push({ trait_type: "Reprint number", value: imprint.reprint_number });
  }
  if (imprint.series_name) {
    attributes.push({ trait_type: "Series", value: imprint.series_name });
    attributes.push({ trait_type: "Series volume", value: imprint.series_volume! });
  }
  if (imprint.language) {
    attributes.push({ trait_type: "Language", value: imprint.language });
  }
  if (imprint.original_publication_date) {
    attributes.push({
      trait_type: "Original publication date",
      value: imprint.original_publication_date,
    });
  }

  return attributes;
}

export function createEmptyWorkPublishImprintForm(): WorkPublishImprintFormValues {
  return {
    publicationDate: "",
    editionNumber: "1",
    editionKind: "first",
    reprintNumber: "",
    seriesName: "",
    seriesVolume: "",
    language: "",
    originalPublicationDate: "",
  };
}
