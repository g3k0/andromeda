import { defaultDisplayName } from "../address";
import { AuthorModel } from "@/lib/db/models/author.model";
import { toAuthorProfile } from "@/lib/db/models/mappers";
import type { AuthorRepository } from "../repository";
import type { AuthorProfile, CreateAuthorProfileInput } from "../types";

export class MongoAuthorRepository implements AuthorRepository {
  async getByAddress(address: string): Promise<AuthorProfile | null> {
    const doc = await AuthorModel.findOne({ address }).lean();
    if (!doc) {
      return null;
    }
    return toAuthorProfile({
      address: doc.address,
      displayName: doc.displayName,
      avatarUrl: doc.avatarUrl ?? null,
      createdAt: doc.createdAt,
    });
  }

  async exists(address: string): Promise<boolean> {
    const doc = await AuthorModel.exists({ address });
    return doc !== null;
  }

  async create(
    address: string,
    input: CreateAuthorProfileInput = {},
  ): Promise<AuthorProfile> {
    const doc = await AuthorModel.create({
      address,
      displayName: input.displayName ?? defaultDisplayName(address),
      avatarUrl: input.avatarUrl ?? null,
    });

    return toAuthorProfile({
      address: doc.address,
      displayName: doc.displayName,
      avatarUrl: doc.avatarUrl ?? null,
      createdAt: doc.createdAt,
    });
  }

  async update(profile: AuthorProfile): Promise<AuthorProfile> {
    const doc = await AuthorModel.findOneAndUpdate(
      { address: profile.address },
      {
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
      },
      { returnDocument: "after" },
    ).lean();

    if (!doc) {
      throw new Error(`Author document missing for ${profile.address}`);
    }

    return toAuthorProfile({
      address: doc.address,
      displayName: doc.displayName,
      avatarUrl: doc.avatarUrl ?? null,
      createdAt: doc.createdAt,
    });
  }
}
