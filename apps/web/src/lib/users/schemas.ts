import { z } from "zod";
import { normalizeAddress } from "@/lib/authors/address";
import { walletAuthSchema } from "@/lib/authors/schemas";
import {
  USER_PERMISSIONS,
  USER_ROLES,
  USER_STATUSES,
} from "./types";

const ethereumAddressSchema = z
  .string()
  .trim()
  .refine((value) => normalizeAddress(value) !== null, {
    message: "Invalid Ethereum address.",
  })
  .transform((value) => normalizeAddress(value)!);

export const userRoleSchema = z.enum(USER_ROLES);
export const userStatusSchema = z.enum(USER_STATUSES);
export const userPermissionSchema = z.enum(USER_PERMISSIONS);

export const walletAuthHeadersSchema = walletAuthSchema;

export const createUserBodySchema = walletAuthSchema.extend({
  targetAddress: ethereumAddressSchema,
  role: userRoleSchema.default("reader"),
  status: userStatusSchema.default("active"),
  permissions: z.array(userPermissionSchema).default([]),
});

export const updateUserBodySchema = walletAuthSchema.extend({
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
  permissions: z.array(userPermissionSchema).optional(),
});

export const updateUserPreferencesBodySchema = walletAuthSchema.extend({
  declinedAuthorPage: z.boolean(),
});

export const listUsersActionSchema = walletAuthSchema;

export const createUserActionSchema = createUserBodySchema;

export const updateUserActionSchema = walletAuthSchema.extend({
  targetAddress: ethereumAddressSchema,
  role: userRoleSchema.optional(),
  status: userStatusSchema.optional(),
  permissions: z.array(userPermissionSchema).optional(),
});

export const deleteUserActionSchema = walletAuthSchema.extend({
  targetAddress: ethereumAddressSchema,
});

export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
export type UpdateUserPreferencesBody = z.infer<
  typeof updateUserPreferencesBodySchema
>;
export type WalletAuthHeaders = z.infer<typeof walletAuthHeadersSchema>;
