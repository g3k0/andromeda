import { z } from "zod";

import { normalizeAddress } from "@/lib/authors/address";
import { walletAuthSchema } from "@/lib/authors/schemas";

import { ForbiddenContentKeyError } from "./errors";
import {
  parseWorkImprintFromFormValues,
  type WorkPublishImprintFormValues,
} from "./work-imprint-metadata";
import type { WorkImprintMetadata } from "@/lib/ipfs/metadata-schema";
import {
  WORK_PUBLISH_EXTERNAL_URL_MAX_LENGTH,
  WORK_PUBLISH_NAME_MAX_LENGTH,
  containsUnsafeControlCharacters,
} from "./work-publish-field-validation";

const safeWorkTextFieldSchema = z
  .string()
  .trim()
  .min(1, "Value is required.")
  .refine((value) => !containsUnsafeControlCharacters(value), {
    message: "Value contains invalid characters.",
  });

const ethereumAddressSchema = z
  .string()
  .trim()
  .refine((value) => normalizeAddress(value) !== null, {
    message: "Invalid author address.",
  })
  .transform((value) => normalizeAddress(value)!);

export const workUploadFieldsSchema = walletAuthSchema.extend({
  name: safeWorkTextFieldSchema.max(WORK_PUBLISH_NAME_MAX_LENGTH),
  authorAddress: ethereumAddressSchema,
  imprint: z.custom<WorkImprintMetadata>(),
  externalUrl: z
    .string()
    .trim()
    .max(WORK_PUBLISH_EXTERNAL_URL_MAX_LENGTH)
    .url()
    .refine(
      (value) => {
        try {
          const parsed = new URL(value);
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "External URL must use HTTP or HTTPS." },
    )
    .optional(),
});

export type WorkUploadFields = z.infer<typeof workUploadFieldsSchema>;

const FORBIDDEN_FORM_FIELDS = new Set([
  "contentkey",
  "content_key",
  "contentKey",
  "k",
  "privatekey",
  "private_key",
  "symmetrickey",
  "symmetric_key",
]);

export function assertNoForbiddenUploadFields(formData: FormData): void {
  for (const key of formData.keys()) {
    if (FORBIDDEN_FORM_FIELDS.has(key.toLowerCase())) {
      throw new ForbiddenContentKeyError();
    }
  }
}

function parseWalletAuthFromFormData(formData: FormData): z.infer<typeof walletAuthSchema> {
  const walletAuthRaw = formData.get("walletAuth");
  if (typeof walletAuthRaw === "string" && walletAuthRaw.trim()) {
    return walletAuthSchema.parse(JSON.parse(walletAuthRaw));
  }

  return walletAuthSchema.parse({
    address: formData.get("address"),
    message: formData.get("message"),
    signature: formData.get("signature"),
  });
}

function readImprintFormValues(formData: FormData): WorkPublishImprintFormValues {
  const editionKind = String(formData.get("editionKind") ?? "first");
  return {
    publicationDate: String(formData.get("publicationDate") ?? ""),
    editionNumber: String(formData.get("editionNumber") ?? ""),
    editionKind: editionKind === "reprint" ? "reprint" : "first",
    reprintNumber: String(formData.get("reprintNumber") ?? ""),
    seriesName: String(formData.get("seriesName") ?? ""),
    seriesVolume: String(formData.get("seriesVolume") ?? ""),
    language: String(formData.get("language") ?? ""),
    originalPublicationDate: String(formData.get("originalPublicationDate") ?? ""),
  };
}

export function parseWorkUploadFields(formData: FormData): WorkUploadFields {
  assertNoForbiddenUploadFields(formData);

  const auth = parseWalletAuthFromFormData(formData);
  const authorAddress = String(formData.get("authorAddress") ?? "");
  const normalizedAuthorAddress = normalizeAddress(authorAddress);
  if (!normalizedAuthorAddress || normalizedAuthorAddress !== auth.address) {
    throw new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        message: "Author address must match the signed wallet.",
        path: ["authorAddress"],
      },
    ]);
  }

  const imprint = parseWorkImprintFromFormValues(
    readImprintFormValues(formData),
    normalizedAuthorAddress,
  );

  return workUploadFieldsSchema.parse({
    ...auth,
    name: formData.get("name"),
    authorAddress: normalizedAuthorAddress,
    imprint,
    externalUrl: formData.get("externalUrl") || undefined,
  });
}
