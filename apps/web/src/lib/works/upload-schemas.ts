import { z } from "zod";

import { walletAuthSchema } from "@/lib/authors/schemas";

import { ForbiddenContentKeyError } from "./errors";
import {
  WORK_PUBLISH_DESCRIPTION_MAX_LENGTH,
  WORK_PUBLISH_EXTERNAL_URL_MAX_LENGTH,
  WORK_PUBLISH_NAME_MAX_LENGTH,
  containsUnsafeControlCharacters,
} from "./work-publish-field-validation";

const safeWorkTextFieldSchema = z
  .string()
  .trim()
  .min(1, "Value is required.")
  .max(WORK_PUBLISH_DESCRIPTION_MAX_LENGTH)
  .refine((value) => !containsUnsafeControlCharacters(value), {
    message: "Value contains invalid characters.",
  });

export const workUploadFieldsSchema = walletAuthSchema.extend({
  name: safeWorkTextFieldSchema.max(WORK_PUBLISH_NAME_MAX_LENGTH),
  description: safeWorkTextFieldSchema.max(WORK_PUBLISH_DESCRIPTION_MAX_LENGTH),
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

export function parseWorkUploadFields(formData: FormData): WorkUploadFields {
  assertNoForbiddenUploadFields(formData);

  const auth = parseWalletAuthFromFormData(formData);

  return workUploadFieldsSchema.parse({
    ...auth,
    name: formData.get("name"),
    description: formData.get("description"),
    externalUrl: formData.get("externalUrl") || undefined,
  });
}
