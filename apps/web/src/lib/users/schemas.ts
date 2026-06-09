import { z } from "zod";
import { normalizeAddress } from "@/lib/authors/address";
import { walletAuthSchema } from "@/lib/authors/schemas";
import { roleSlugSchema } from "@/lib/roles/schemas";
import { USER_PERMISSIONS, USER_STATUSES } from "./types";

const ethereumAddressSchema = z
  .string()
  .trim()
  .refine((value) => normalizeAddress(value) !== null, {
    message: "Invalid Ethereum address.",
  })
  .transform((value) => normalizeAddress(value)!);

export const userStatusSchema = z.enum(USER_STATUSES);
export const userPermissionSchema = z.enum(USER_PERMISSIONS);

export const walletAuthHeadersSchema = walletAuthSchema;

export const createUserBodySchema = walletAuthSchema.extend({
  targetAddress: ethereumAddressSchema,
  roleSlug: roleSlugSchema.default("reader"),
  status: userStatusSchema.default("active"),
  permissionOverrides: z.array(userPermissionSchema).default([]),
});

export const updateUserBodySchema = walletAuthSchema.extend({
  roleSlug: roleSlugSchema.optional(),
  status: userStatusSchema.optional(),
  permissionOverrides: z.array(userPermissionSchema).optional(),
});

export const updateUserPreferencesBodySchema = walletAuthSchema.extend({
  declinedAuthorPage: z.boolean(),
});

export const listUsersActionSchema = walletAuthSchema;

export const createUserActionSchema = createUserBodySchema;

export const updateUserActionSchema = walletAuthSchema.extend({
  targetAddress: ethereumAddressSchema,
  roleSlug: roleSlugSchema.optional(),
  status: userStatusSchema.optional(),
  permissionOverrides: z.array(userPermissionSchema).optional(),
});

export const deleteUserActionSchema = walletAuthSchema.extend({
  targetAddress: ethereumAddressSchema,
});

export const createUserSessionBodySchema = z.object({
  targetAddress: ethereumAddressSchema,
  roleSlug: roleSlugSchema.default("reader"),
  status: userStatusSchema.default("active"),
  permissionOverrides: z.array(userPermissionSchema).default([]),
});

export const updateUserSessionBodySchema = z.object({
  targetAddress: ethereumAddressSchema,
  roleSlug: roleSlugSchema.optional(),
  status: userStatusSchema.optional(),
  permissionOverrides: z.array(userPermissionSchema).optional(),
});

export const deleteUserSessionBodySchema = z.object({
  targetAddress: ethereumAddressSchema,
});

export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
export type UpdateUserPreferencesBody = z.infer<
  typeof updateUserPreferencesBodySchema
>;
export type WalletAuthHeaders = z.infer<typeof walletAuthHeadersSchema>;
