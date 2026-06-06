import { UserModel } from "@/lib/db/models/user.model";
import { toUser } from "@/lib/db/models/mappers";
import type { UserRepository } from "../repository";
import type { CreateUserInput, User, UserListFilter } from "../types";
import { defaultUserPreferences } from "../types";

export class MongoUserRepository implements UserRepository {
  async getByAddress(address: string): Promise<User | null> {
    const doc = await UserModel.findOne({ address }).lean();
    if (!doc) {
      return null;
    }
    return toUser({
      address: doc.address,
      role: doc.role,
      status: doc.status,
      permissions: doc.permissions,
      preferences: doc.preferences,
      metadata: doc.metadata as Record<string, unknown> | null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async exists(address: string): Promise<boolean> {
    const doc = await UserModel.exists({ address });
    return doc !== null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const preferences = {
      ...defaultUserPreferences(),
      ...input.preferences,
    };

    const doc = await UserModel.create({
      address: input.address,
      role: input.role ?? "reader",
      status: input.status ?? "active",
      permissions: input.permissions ?? [],
      preferences: {
        declinedAuthorPage: preferences.declinedAuthorPage,
        onboardingCompletedAt: preferences.onboardingCompletedAt
          ? new Date(preferences.onboardingCompletedAt)
          : null,
      },
      metadata: input.metadata ?? {},
    });

    return toUser({
      address: doc.address,
      role: doc.role,
      status: doc.status,
      permissions: doc.permissions,
      preferences: doc.preferences,
      metadata: doc.metadata as Record<string, unknown> | null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async update(user: User): Promise<User> {
    const doc = await UserModel.findOneAndUpdate(
      { address: user.address },
      {
        role: user.role,
        status: user.status,
        permissions: user.permissions,
        preferences: {
          declinedAuthorPage: user.preferences.declinedAuthorPage,
          onboardingCompletedAt: user.preferences.onboardingCompletedAt
            ? new Date(user.preferences.onboardingCompletedAt)
            : null,
        },
        metadata: user.metadata,
      },
      { returnDocument: "after" },
    ).lean();

    if (!doc) {
      throw new Error(`User document missing for ${user.address}`);
    }

    return toUser({
      address: doc.address,
      role: doc.role,
      status: doc.status,
      permissions: doc.permissions,
      preferences: doc.preferences,
      metadata: doc.metadata as Record<string, unknown> | null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async delete(address: string): Promise<void> {
    await UserModel.deleteOne({ address });
  }

  async list(filter: UserListFilter = {}): Promise<User[]> {
    const query: Record<string, string> = {};
    if (filter.role) {
      query.role = filter.role;
    }
    if (filter.status) {
      query.status = filter.status;
    }

    const docs = await UserModel.find(query).lean();
    return docs.map((doc) =>
      toUser({
        address: doc.address,
        role: doc.role,
        status: doc.status,
        permissions: doc.permissions,
        preferences: doc.preferences,
        metadata: doc.metadata as Record<string, unknown> | null,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }),
    );
  }
}
