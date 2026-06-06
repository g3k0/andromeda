import { normalizeAddress } from "@/lib/authors/address";
import { InvalidAddressError } from "@/lib/authors/errors";
import {
  InvalidUserRoleError,
  UserExistsError,
  UserNotFoundError,
  UserSuspendedError,
} from "./errors";
import type { UserRepository } from "./repository";
import type {
  CreateUserInput,
  User,
  UserListFilter,
  UserRole,
  UserSnapshot,
} from "./types";
import { defaultUserPreferences, isUserRole } from "./types";

export type AuthorProfileLookup = {
  hasAuthorProfile(address: string): Promise<boolean>;
};

function requireNormalizedAddress(address: string): string {
  const normalized = normalizeAddress(address);
  if (!normalized) {
    throw new InvalidAddressError(address);
  }
  return normalized;
}

export function createUserService(
  users: UserRepository,
  authorLookup?: AuthorProfileLookup,
) {
  return {
    async getByAddress(address: string): Promise<User | null> {
      const normalized = normalizeAddress(address);
      if (!normalized) {
        return null;
      }
      return users.getByAddress(normalized);
    },

    async list(filter?: UserListFilter): Promise<User[]> {
      return users.list(filter);
    },

    assertActive(user: User): void {
      if (user.status !== "active") {
        throw new UserSuspendedError(user.address);
      }
    },

    async findOrCreateByWallet(address: string): Promise<User> {
      const normalized = requireNormalizedAddress(address);
      const existing = await users.getByAddress(normalized);
      if (existing) {
        return existing;
      }

      return users.create({
        address: normalized,
        role: "reader",
        status: "active",
        preferences: defaultUserPreferences(),
      });
    },

    async getSnapshot(
      address: string | null | undefined,
      isConnected: boolean,
    ): Promise<UserSnapshot | null> {
      if (!isConnected || !address) {
        return null;
      }

      const normalized = normalizeAddress(address);
      if (!normalized) {
        return null;
      }

      const user = await users.getByAddress(normalized);
      if (!user) {
        return null;
      }

      const hasAuthorProfile = authorLookup
        ? await authorLookup.hasAuthorProfile(normalized)
        : user.role === "author";

      return {
        normalizedAddress: normalized,
        isConnected: true,
        role: user.role,
        status: user.status,
        hasAuthorProfile,
        declinedAuthorPage: user.preferences.declinedAuthorPage,
      };
    },

    async createUser(input: CreateUserInput): Promise<User> {
      const normalized = requireNormalizedAddress(input.address);
      if (await users.exists(normalized)) {
        throw new UserExistsError(normalized);
      }

      return users.create({
        ...input,
        address: normalized,
      });
    },

    async updateUser(user: User): Promise<User> {
      this.assertActive(user);
      const existing = await users.getByAddress(user.address);
      if (!existing) {
        throw new UserNotFoundError(user.address);
      }
      return users.update(user);
    },

    async deleteUser(address: string): Promise<void> {
      const normalized = requireNormalizedAddress(address);
      const existing = await users.getByAddress(normalized);
      if (!existing) {
        throw new UserNotFoundError(normalized);
      }
      await users.delete(normalized);
    },

    async promoteToAuthor(address: string): Promise<User> {
      const normalized = requireNormalizedAddress(address);
      const user = await users.getByAddress(normalized);
      if (!user) {
        throw new UserNotFoundError(normalized);
      }
      this.assertActive(user);

      if (user.role === "admin") {
        return user;
      }

      return users.update({
        ...user,
        role: "author",
      });
    },

    async demoteToReader(address: string): Promise<User> {
      const normalized = requireNormalizedAddress(address);
      const user = await users.getByAddress(normalized);
      if (!user) {
        throw new UserNotFoundError(normalized);
      }
      this.assertActive(user);

      if (user.role === "admin") {
        return user;
      }

      return users.update({
        ...user,
        role: "reader",
      });
    },

    async setRole(address: string, role: UserRole): Promise<User> {
      if (!isUserRole(role)) {
        throw new InvalidUserRoleError(role);
      }

      const normalized = requireNormalizedAddress(address);
      const user = await users.getByAddress(normalized);
      if (!user) {
        throw new UserNotFoundError(normalized);
      }
      this.assertActive(user);

      return users.update({
        ...user,
        role,
      });
    },

    async setPreferences(
      address: string,
      preferences: Partial<User["preferences"]>,
    ): Promise<User> {
      const normalized = requireNormalizedAddress(address);
      const user = await users.getByAddress(normalized);
      if (!user) {
        throw new UserNotFoundError(normalized);
      }
      this.assertActive(user);

      return users.update({
        ...user,
        preferences: {
          ...user.preferences,
          ...preferences,
          onboardingCompletedAt:
            preferences.onboardingCompletedAt ??
            user.preferences.onboardingCompletedAt ??
            new Date().toISOString(),
        },
      });
    },
  };
}

export type UserService = ReturnType<typeof createUserService>;
