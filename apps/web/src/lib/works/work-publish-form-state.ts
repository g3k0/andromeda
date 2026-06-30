import { parseEther } from "viem";

import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";

import { WorkUploadValidationError } from "./errors";
import { validateManuscriptFileForForm } from "./manuscript-upload";
import {
  createEmptyWorkPublishImprintForm,
  validateWorkPublishImprintForm,
  type WorkPublishImprintFormValues,
} from "./work-imprint-metadata";
import {
  ALLOWED_WORK_COVER_MIME_TYPES,
  MAX_WORK_COVER_BYTES,
} from "./upload-limits";
import {
  validateWorkPublishExternalUrl,
  validateWorkPublishMaxCopies,
  validateWorkPublishName,
  validateWorkPublishPriceMatic,
} from "./work-publish-field-validation";

export type WorkPublishFormValues = {
  name: string;
  priceMatic: string;
  maxCopies: string;
  externalUrl: string;
} & WorkPublishImprintFormValues;

export type WorkPublishFormErrors = Partial<
  Record<keyof WorkPublishFormValues | "coverImage" | "manuscriptFile", string>
>;

export type WorkPublishStep =
  | "idle"
  | "encrypting"
  | "uploading"
  | "ready"
  | "registering"
  | "success"
  | "error";

export function createEmptyWorkPublishForm(): WorkPublishFormValues {
  return {
    name: "",
    ...createEmptyWorkPublishImprintForm(),
    priceMatic: "",
    maxCopies: "1",
    externalUrl: "",
  };
}

export function validateWorkPublishForm(
  values: WorkPublishFormValues,
  coverImage: File | null,
  manuscriptFile: File | null,
): WorkPublishFormErrors {
  const errors: WorkPublishFormErrors = {};

  const nameError = validateWorkPublishName(values.name);
  if (nameError) {
    errors.name = nameError;
  }

  const imprintErrors = validateWorkPublishImprintForm(values);
  Object.assign(errors, imprintErrors);

  const manuscriptError = validateManuscriptFileForForm(manuscriptFile);
  if (manuscriptError) {
    errors.manuscriptFile = manuscriptError;
  }

  if (!coverImage) {
    errors.coverImage = "Cover image is required.";
  } else if (!ALLOWED_WORK_COVER_MIME_TYPES.includes(coverImage.type as never)) {
    errors.coverImage = "Cover must be PNG, JPEG, or WebP.";
  } else if (coverImage.size > MAX_WORK_COVER_BYTES) {
    errors.coverImage = "Cover image is too large.";
  }

  const priceError = validateWorkPublishPriceMatic(values.priceMatic);
  if (priceError) {
    errors.priceMatic = priceError;
  }

  const maxCopiesError = validateWorkPublishMaxCopies(values.maxCopies);
  if (maxCopiesError) {
    errors.maxCopies = maxCopiesError;
  }

  const externalUrlError = validateWorkPublishExternalUrl(values.externalUrl);
  if (externalUrlError) {
    errors.externalUrl = externalUrlError;
  }

  return errors;
}

export function hasWorkPublishFormErrors(errors: WorkPublishFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function parseRegisterWorkParams(values: WorkPublishFormValues): {
  priceWei: bigint;
  maxCopies: bigint;
} {
  return {
    priceWei: parseEther(values.priceMatic.trim() || "0"),
    maxCopies: BigInt(values.maxCopies.trim()),
  };
}

export function formatMetadataPreview(metadata: AcePublicMetadata): string {
  return JSON.stringify(metadata, null, 2);
}

export function assertCoverImageReady(coverImage: File | null): asserts coverImage is File {
  const errors = validateWorkPublishForm(
    {
      ...createEmptyWorkPublishForm(),
      name: "x",
      publicationDate: "2026-01-01",
    },
    coverImage,
    new File(["chapter"], "novel.txt", { type: "text/plain" }),
  );

  if (errors.coverImage) {
    throw new WorkUploadValidationError(errors.coverImage);
  }
}
