import type { UserRepository } from "../repository";
import type { CreateUserInput, User, UserListFilter } from "../types";
import { defaultUserPreferences } from "../types";

export function createInMemoryUserRepository(): UserRepository {
  const users = new Map<string, User>();

  return {
    async getByAddress(address: string) {
      return users.get(address) ?? null;
    },

    async exists(address: string) {
      return users.has(address);
    },

    async create(input: CreateUserInput) {
      const now = new Date().toISOString();
      const preferences = {
        ...defaultUserPreferences(),
        ...input.preferences,
      };

      const user: User = {
        address: input.address,
        role: input.role ?? "reader",
        status: input.status ?? "active",
        permissions: input.permissions ?? [],
        preferences,
        metadata: input.metadata ?? {},
        createdAt: now,
        updatedAt: now,
      };

      users.set(input.address, user);
      return user;
    },

    async update(user: User) {
      const updated: User = {
        ...user,
        updatedAt: new Date().toISOString(),
      };
      users.set(user.address, updated);
      return updated;
    },

    async delete(address: string) {
      users.delete(address);
    },

    async list(filter: UserListFilter = {}) {
      return [...users.values()].filter((user) => {
        if (filter.role && user.role !== filter.role) {
          return false;
        }
        if (filter.status && user.status !== filter.status) {
          return false;
        }
        return true;
      });
    },
  };
}
