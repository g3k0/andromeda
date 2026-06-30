import { z } from "zod";
import { normalizeAddress } from "./address";
import {
  AUTHOR_AVATAR_URL_MAX_LENGTH,
  AUTHOR_BIO_MAX_LENGTH,
  AUTHOR_DISPLAY_NAME_MAX_LENGTH,
} from "./field-limits";
import { containsUnsafeBioControlCharacters } from "./author-bio-validation";

const ethereumAddressSchema = z
  .string()
  .trim()
  .refine((value) => normalizeAddress(value) !== null, {
    message: "Invalid Ethereum address.",
  })
  .transform((value) => normalizeAddress(value)!);

const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Display name is required.")
  .max(AUTHOR_DISPLAY_NAME_MAX_LENGTH)
  .refine((value) => !/[\u0000-\u001F\u007F]/.test(value), {
    message: "Display name contains invalid characters.",
  });

const avatarUrlSchema = z
  .union([
    z.null(),
    z
      .string()
      .max(AUTHOR_AVATAR_URL_MAX_LENGTH)
      .regex(
        /^data:image\/(png|jpeg|jpg|webp);base64,[a-zA-Z0-9+/=]+$/,
        "Avatar must be a supported image data URL.",
      ),
  ])
  .optional();

function normalizeBioInput(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value !== "string") {
    return value as never;
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

const bioSchema = z.preprocess(
  normalizeBioInput,
  z
    .union([
      z.null(),
      z
        .string()
        .max(AUTHOR_BIO_MAX_LENGTH)
        .refine((value) => !containsUnsafeBioControlCharacters(value), {
          message: "Bio contains invalid characters.",
        }),
    ])
    .optional(),
);

export const walletAuthSchema = z.object({
  address: ethereumAddressSchema,
  message: z.string().min(1),
  signature: z
    .string()
    .regex(/^0x[a-fA-F0-9]+$/, "Invalid signature format.")
    .transform((value) => value as `0x${string}`),
});

export const createAuthorBodySchema = walletAuthSchema.extend({
  displayName: displayNameSchema.optional(),
  avatarUrl: avatarUrlSchema,
  bio: bioSchema,
});

export const updateAuthorMutationSchema = walletAuthSchema.extend({
  displayName: displayNameSchema,
  avatarUrl: avatarUrlSchema,
  bio: bioSchema,
});

export const updateAuthorActionSchema = updateAuthorMutationSchema.extend({
  targetAddress: ethereumAddressSchema,
});

export const walletPreferencesBodySchema = walletAuthSchema.extend({
  declinedAuthorPage: z.boolean(),
});

export type WalletAuthInput = z.infer<typeof walletAuthSchema>;
export type CreateAuthorBody = z.infer<typeof createAuthorBodySchema>;
export type UpdateAuthorMutation = z.infer<typeof updateAuthorMutationSchema>;
export type UpdateAuthorActionInput = z.infer<typeof updateAuthorActionSchema>;
export type WalletPreferencesBody = z.infer<typeof walletPreferencesBodySchema>;
