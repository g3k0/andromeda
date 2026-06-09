import { RoleModel } from "@/lib/db/models/role.model";
import type { RoleRepository } from "../repository";
import type { CreateRoleInput, UpdateRoleInput } from "../types";
import { toRole } from "./role-mapper";

export class MongoRoleRepository implements RoleRepository {
  async list(): Promise<ReturnType<typeof toRole>[]> {
    const docs = await RoleModel.find().sort({ name: 1 }).lean();
    return docs.map((doc) =>
      toRole({
        ...doc,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }),
    );
  }

  async getBySlug(slug: string): Promise<ReturnType<typeof toRole> | null> {
    const doc = await RoleModel.findOne({ slug }).lean();
    if (!doc) {
      return null;
    }

    return toRole({
      ...doc,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async exists(slug: string): Promise<boolean> {
    const doc = await RoleModel.exists({ slug });
    return doc !== null;
  }

  async create(input: CreateRoleInput): Promise<ReturnType<typeof toRole>> {
    const doc = await RoleModel.create({
      slug: input.slug,
      name: input.name,
      description: input.description ?? null,
      permissions: input.permissions,
      isSystem: input.isSystem ?? false,
    });

    return toRole({
      slug: doc.slug,
      name: doc.name,
      description: doc.description,
      permissions: doc.permissions,
      isSystem: doc.isSystem,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async update(
    slug: string,
    input: UpdateRoleInput,
  ): Promise<ReturnType<typeof toRole>> {
    const doc = await RoleModel.findOneAndUpdate(
      { slug },
      {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.permissions !== undefined
          ? { permissions: input.permissions }
          : {}),
      },
      { returnDocument: "after" },
    ).lean();

    if (!doc) {
      throw new Error(`Role document missing for ${slug}`);
    }

    return toRole({
      ...doc,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async delete(slug: string): Promise<void> {
    await RoleModel.deleteOne({ slug });
  }
}
