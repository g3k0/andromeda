import { normalizeAddress } from "@/lib/authors/address";
import { InvalidAddressError } from "@/lib/authors/errors";
import type { RoleRepository } from "@/lib/roles/repository";
import { toAuthenticatedUser } from "./authenticated-user";
import {
  InvalidUserRoleError,
  InvalidUserRoleTransitionError,
  UserExistsError,
  UserNotFoundError,
  UserSuspendedError,
} from "./errors";
import { validateRoleTransition } from "./role-transitions";
import type { UserRepository } from "./repository";
import type {
  AuthenticatedUser,
  CreateUserInput,
  User,
  UserListFilter,
  UserSnapshot,
} from "./types";
import { defaultUserPreferences } from "./types";

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

async function resolveAuthorProfile(
  address: string,
  authorLookup?: AuthorProfileLookup,
): Promise<boolean> {
  return authorLookup ? authorLookup.hasAuthorProfile(address) : false;
}

async function assertValidRoleTransition(
  user: User,
  nextRoleSlug: string,
  authorLookup?: AuthorProfileLookup,
): Promise<void> {
  const hasAuthorProfile = await resolveAuthorProfile(user.address, authorLookup);
  const error = validateRoleTransition(user.roleSlug, nextRoleSlug, {
    hasAuthorProfile,
  });
  if (error) {
    throw new InvalidUserRoleTransitionError(error);
  }
}

async function ensureRoleMatchesAuthorProfile(
  users: UserRepository,
  user: User,
  hasAuthorProfile: boolean,
): Promise<User> {
  if (
    user.roleSlug === "admin" ||
    !hasAuthorProfile ||
    user.roleSlug === "author"
  ) {
    return user;
  }

  return users.update({
    ...user,
    roleSlug: "author",
  });
}

export function createUserService(
  users: UserRepository,
  roles: RoleRepository,
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

    async getAuthenticatedByAddress(
      address: string,
    ): Promise<AuthenticatedUser | null> {
      const user = await this.getByAddress(address);
      if (!user) {
        return null;
      }
      return toAuthenticatedUser(user, roles);
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
      const hasAuthorProfile = authorLookup
        ? await authorLookup.hasAuthorProfile(normalized)
        : false;
      const existing = await users.getByAddress(normalized);
      if (existing) {
        return ensureRoleMatchesAuthorProfile(
          users,
          existing,
          hasAuthorProfile,
        );
      }

      return users.create({
        address: normalized,
        roleSlug: hasAuthorProfile ? "author" : "reader",
        status: "active",
        preferences: defaultUserPreferences(),
      });
    },

    async getSnapshot(
      address: string | null | undefined,
      isConnected: boolean,
      authorLookupOverride?: AuthorProfileLookup,
    ): Promise<UserSnapshot | null> {
      if (!isConnected || !address) {
        return null;
      }

      const normalized = normalizeAddress(address);
      if (!normalized) {
        return null;
      }

      let user = await users.getByAddress(normalized);
      if (!user) {
        return null;
      }

      const lookup = authorLookupOverride ?? authorLookup;
      const hasAuthorProfile = lookup
        ? await lookup.hasAuthorProfile(normalized)
        : user.roleSlug === "author";

      user = await ensureRoleMatchesAuthorProfile(
        users,
        user,
        hasAuthorProfile,
      );

      const authenticated = await toAuthenticatedUser(user, roles);

      return {
        normalizedAddress: normalized,
        isConnected: true,
        roleSlug: authenticated.roleSlug,
        roleName: authenticated.role.name,
        status: authenticated.status,
        permissions: authenticated.permissions,
        hasAuthorProfile,
        declinedAuthorPage: authenticated.preferences.declinedAuthorPage,
      };
    },

    async createUser(input: CreateUserInput): Promise<User> {
      const normalized = requireNormalizedAddress(input.address);
      if (await users.exists(normalized)) {
        throw new UserExistsError(normalized);
      }

      if (input.roleSlug) {
        const role = await roles.getBySlug(input.roleSlug);
        if (!role) {
          throw new InvalidUserRoleError(input.roleSlug);
        }
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

      if (user.roleSlug !== existing.roleSlug) {
        const role = await roles.getBySlug(user.roleSlug);
        if (!role) {
          throw new InvalidUserRoleError(user.roleSlug);
        }
        await assertValidRoleTransition(user, user.roleSlug, authorLookup);
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

      if (user.roleSlug === "admin") {
        return user;
      }

      return users.update({
        ...user,
        roleSlug: "author",
      });
    },

    async demoteToReader(address: string): Promise<User> {
      const normalized = requireNormalizedAddress(address);
      const user = await users.getByAddress(normalized);
      if (!user) {
        throw new UserNotFoundError(normalized);
      }
      this.assertActive(user);

      if (user.roleSlug === "admin") {
        return user;
      }

      return users.update({
        ...user,
        roleSlug: "reader",
      });
    },

    async setRoleSlug(address: string, roleSlug: string): Promise<User> {
      const role = await roles.getBySlug(roleSlug);
      if (!role) {
        throw new InvalidUserRoleError(roleSlug);
      }

      const normalized = requireNormalizedAddress(address);
      const user = await users.getByAddress(normalized);
      if (!user) {
        throw new UserNotFoundError(normalized);
      }
      this.assertActive(user);
      await assertValidRoleTransition(user, roleSlug, authorLookup);

      return users.update({
        ...user,
        roleSlug,
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
