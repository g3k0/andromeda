import type { WorkImprintMetadata } from "@/lib/ipfs/metadata-schema";
import { workImprintMetadataSchema } from "@/lib/ipfs/metadata-schema";
import type { TranslateFn } from "@/lib/i18n/translate";
import { getPublishFieldLabel } from "@/lib/i18n/publish-messages";

import { containsUnsafeControlCharacters } from "./work-publish-field-validation";

export type { WorkImprintMetadata } from "@/lib/ipfs/metadata-schema";
export { workImprintMetadataSchema } from "@/lib/ipfs/metadata-schema";

export const WORK_PUBLISH_SERIES_NAME_MAX_LENGTH = 120;
export const WORK_PUBLISH_LANGUAGE_MAX_LENGTH = 32;
export const WORK_PUBLISH_BACK_COVER_TEXT_MAX_LENGTH = 2000;
export const WORK_PUBLISH_ABOUT_AUTHOR_MAX_LENGTH = 1000;

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
  backCoverText: string;
  aboutAuthor: string;
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

function validateOptionalIsoDate(
  value: string,
  label: string,
  t: TranslateFn,
): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (!ISO_DATE_PATTERN.test(trimmed)) {
    return t("publish.validation.date.invalidFormat", { label });
  }
  if (Number.isNaN(Date.parse(`${trimmed}T00:00:00.000Z`))) {
    return t("publish.validation.date.invalid", { label });
  }
  return null;
}

function validateRequiredTextField(
  value: string,
  label: string,
  maxLength: number,
  t: TranslateFn,
): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return t("publish.validation.field.required", { label });
  }
  if (trimmed.length > maxLength) {
    return t("publish.validation.field.maxLength", {
      label,
      max: String(maxLength),
    });
  }
  if (containsUnsafeControlCharacters(trimmed)) {
    return t("publish.validation.field.invalidCharacters", { label });
  }
  return null;
}

function validateOptionalTextField(
  value: string,
  label: string,
  maxLength: number,
  t: TranslateFn,
): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > maxLength) {
    return t("publish.validation.field.maxLength", {
      label,
      max: String(maxLength),
    });
  }
  if (containsUnsafeControlCharacters(trimmed)) {
    return t("publish.validation.field.invalidCharacters", { label });
  }
  return null;
}

export function validateWorkPublishImprintForm(
  values: WorkPublishImprintFormValues,
  t: TranslateFn,
): WorkPublishImprintFormErrors {
  const errors: WorkPublishImprintFormErrors = {};

  const publicationDateLabel = getPublishFieldLabel(t, "publicationDate");
  const publicationDateError = validateOptionalIsoDate(
    values.publicationDate,
    publicationDateLabel,
    t,
  );
  if (!values.publicationDate.trim()) {
    errors.publicationDate = t("publish.validation.publicationDate.required");
  } else if (publicationDateError) {
    errors.publicationDate = publicationDateError;
  }

  const editionNumber = parseOptionalPositiveInteger(values.editionNumber);
  if (!values.editionNumber.trim()) {
    errors.editionNumber = t("publish.validation.editionNumber.required");
  } else if (Number.isNaN(editionNumber)) {
    errors.editionNumber = t("publish.validation.editionNumber.invalid");
  }

  if (values.editionKind !== "first" && values.editionKind !== "reprint") {
    errors.editionKind = t("publish.validation.editionKind.required");
  }

  if (values.editionKind === "reprint") {
    const reprintNumber = parseOptionalPositiveInteger(values.reprintNumber);
    if (!values.reprintNumber.trim()) {
      errors.reprintNumber = t("publish.validation.reprintNumber.required");
    } else if (Number.isNaN(reprintNumber)) {
      errors.reprintNumber = t("publish.validation.reprintNumber.invalid");
    }
  }

  const seriesNameError = validateOptionalTextField(
    values.seriesName,
    getPublishFieldLabel(t, "seriesName"),
    WORK_PUBLISH_SERIES_NAME_MAX_LENGTH,
    t,
  );
  if (seriesNameError) {
    errors.seriesName = seriesNameError;
  }

  if (values.seriesName.trim()) {
    const seriesVolume = parseOptionalPositiveInteger(values.seriesVolume);
    if (!values.seriesVolume.trim()) {
      errors.seriesVolume = t("publish.validation.seriesVolume.requiredWithSeries");
    } else if (Number.isNaN(seriesVolume)) {
      errors.seriesVolume = t("publish.validation.seriesVolume.invalid");
    }
  } else if (values.seriesVolume.trim()) {
    errors.seriesVolume = t("publish.validation.seriesVolume.requiresSeriesName");
  }

  const languageError = validateOptionalTextField(
    values.language,
    getPublishFieldLabel(t, "language"),
    WORK_PUBLISH_LANGUAGE_MAX_LENGTH,
    t,
  );
  if (languageError) {
    errors.language = languageError;
  }

  const originalPublicationDateError = validateOptionalIsoDate(
    values.originalPublicationDate,
    getPublishFieldLabel(t, "originalPublicationDate"),
    t,
  );
  if (originalPublicationDateError) {
    errors.originalPublicationDate = originalPublicationDateError;
  }

  const backCoverTextError = validateRequiredTextField(
    values.backCoverText,
    getPublishFieldLabel(t, "backCoverText"),
    WORK_PUBLISH_BACK_COVER_TEXT_MAX_LENGTH,
    t,
  );
  if (backCoverTextError) {
    errors.backCoverText = backCoverTextError;
  }

  const aboutAuthorError = validateRequiredTextField(
    values.aboutAuthor,
    getPublishFieldLabel(t, "aboutAuthor"),
    WORK_PUBLISH_ABOUT_AUTHOR_MAX_LENGTH,
    t,
  );
  if (aboutAuthorError) {
    errors.aboutAuthor = aboutAuthorError;
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
    back_cover_text: values.backCoverText.trim(),
    about_author: values.aboutAuthor.trim(),
    author_address: authorAddress,
  };

  return workImprintMetadataSchema.parse(imprint);
}

export function buildWorkDescriptionFromImprint(
  imprint: WorkImprintMetadata,
): string {
  const parts: string[] = [imprint.back_cover_text];
  const editionParts: string[] = [];

  if (imprint.edition_kind === "first") {
    editionParts.push(`First edition, edition ${imprint.edition_number}`);
  } else {
    editionParts.push(
      `Reprint ${imprint.reprint_number}, edition ${imprint.edition_number}`,
    );
  }

  editionParts.push(`published ${imprint.publication_date}`);

  if (imprint.original_publication_date) {
    editionParts.push(`originally published ${imprint.original_publication_date}`);
  }

  if (imprint.series_name) {
    editionParts.push(`Vol. ${imprint.series_volume} of ${imprint.series_name}`);
  }

  if (imprint.language) {
    editionParts.push(`Language: ${imprint.language}`);
  }

  editionParts.push(`Author: ${imprint.author_address}`);

  parts.push(editionParts.join(" · "));

  return parts.join("\n\n");
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
    backCoverText: "",
    aboutAuthor: "",
  };
}
