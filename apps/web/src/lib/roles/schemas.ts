import { z } from "zod";
import { walletAuthSchema } from "@/lib/authors/schemas";
import { USER_PERMISSIONS } from "@/lib/users/types";
import { ROLE_SLUG_PATTERN } from "./types";

export const roleSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((value) => ROLE_SLUG_PATTERN.test(value), {
    message: "Invalid role slug.",
  });

export const rolePermissionSchema = z.enum(USER_PERMISSIONS);

export const createRoleBodySchema = z.object({
  slug: roleSlugSchema,
  name: z.string().trim().min(1).max(64),
  description: z.string().trim().max(256).optional().nullable(),
  permissions: z.array(rolePermissionSchema).min(1),
});

export const createRoleApiBodySchema = walletAuthSchema.extend({
  slug: roleSlugSchema,
  name: z.string().trim().min(1).max(64),
  description: z.string().trim().max(256).optional().nullable(),
  permissions: z.array(rolePermissionSchema).min(1),
});

export const updateRoleBodySchema = z.object({
  name: z.string().trim().min(1).max(64).optional(),
  description: z.string().trim().max(256).optional().nullable(),
  permissions: z.array(rolePermissionSchema).min(1).optional(),
});

export const updateRoleApiBodySchema = walletAuthSchema.extend({
  name: z.string().trim().min(1).max(64).optional(),
  description: z.string().trim().max(256).optional().nullable(),
  permissions: z.array(rolePermissionSchema).min(1).optional(),
});

export type CreateRoleBody = z.infer<typeof createRoleApiBodySchema>;
export type UpdateRoleBody = z.infer<typeof updateRoleApiBodySchema>;

export const createRoleActionSchema = createRoleBodySchema;

export const updateRoleActionSchema = z.object({
  slug: roleSlugSchema,
  name: z.string().trim().min(1).max(64).optional(),
  description: z.string().trim().max(256).optional().nullable(),
  permissions: z.array(rolePermissionSchema).min(1).optional(),
});

export const deleteRoleActionSchema = z.object({
  slug: roleSlugSchema,
});

export const listRolesActionSchema = z.object({}).optional();
