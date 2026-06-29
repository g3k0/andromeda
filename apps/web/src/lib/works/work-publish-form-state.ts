import { parseEther } from "viem";

import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";

import { WorkUploadValidationError } from "./errors";
import {
  ALLOWED_WORK_COVER_MIME_TYPES,
  MAX_WORK_COVER_BYTES,
} from "./upload-limits";

export type WorkPublishFormValues = {
  name: string;
  description: string;
  manuscriptText: string;
  priceMatic: string;
  maxCopies: string;
  externalUrl: string;
};

export type WorkPublishFormErrors = Partial<
  Record<keyof WorkPublishFormValues | "coverImage", string>
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
    description: "",
    manuscriptText: "",
    priceMatic: "0",
    maxCopies: "0",
    externalUrl: "",
  };
}

export function validateWorkPublishForm(
  values: WorkPublishFormValues,
  coverImage: File | null,
): WorkPublishFormErrors {
  const errors: WorkPublishFormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Title is required.";
  }

  if (!values.description.trim()) {
    errors.description = "Description is required.";
  }

  if (!values.manuscriptText.trim()) {
    errors.manuscriptText = "Manuscript text is required.";
  }

  if (!coverImage) {
    errors.coverImage = "Cover image is required.";
  } else if (!ALLOWED_WORK_COVER_MIME_TYPES.includes(coverImage.type as never)) {
    errors.coverImage = "Cover must be PNG, JPEG, or WebP.";
  } else if (coverImage.size > MAX_WORK_COVER_BYTES) {
    errors.coverImage = "Cover image is too large.";
  }

  try {
    const price = parseEther(values.priceMatic.trim() || "0");
    if (price < 0n) {
      errors.priceMatic = "Price must be zero or greater.";
    }
  } catch {
    errors.priceMatic = "Enter a valid MATIC price.";
  }

  const maxCopies = Number.parseInt(values.maxCopies.trim() || "0", 10);
  if (!Number.isFinite(maxCopies) || maxCopies < 0) {
    errors.maxCopies = "Max copies must be zero or greater.";
  }

  if (values.externalUrl.trim()) {
    try {
      new URL(values.externalUrl.trim());
    } catch {
      errors.externalUrl = "Enter a valid URL.";
    }
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
    maxCopies: BigInt(values.maxCopies.trim() || "0"),
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
      description: "x",
      manuscriptText: "x",
    },
    coverImage,
  );

  if (errors.coverImage) {
    throw new WorkUploadValidationError(errors.coverImage);
  }
}
