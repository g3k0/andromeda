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
import { assertValidPermissionOverrides } from "./permission-overrides-policy";
import { userMetadataSchema } from "./user-metadata-schema";
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

async function assertRoleSlugExists(
  roles: RoleRepository,
  roleSlug: string,
): Promise<void> {
  const role = await roles.getBySlug(roleSlug);
  if (!role) {
    throw new InvalidUserRoleError(roleSlug);
  }
}

async function syncRoleWithAuthorProfile(
  users: UserRepository,
  user: User,
  hasAuthorProfile: boolean,
  invalidateUserSessions: (address: string) => Promise<void>,
): Promise<User> {
  if (user.roleSlug === "admin") {
    return user;
  }

  if (hasAuthorProfile && user.roleSlug !== "author") {
    return users.update({
      ...user,
      roleSlug: "author",
    });
  }

  if (!hasAuthorProfile && user.roleSlug === "author") {
    const updated = await users.update({
      ...user,
      roleSlug: "reader",
    });
    await invalidateUserSessions(user.address);
    return updated;
  }

  return user;
}

export type UserServiceOptions = {
  authorLookup?: AuthorProfileLookup;
  invalidateUserSessions?: (address: string) => Promise<void>;
};

export function createUserService(
  users: UserRepository,
  roles: RoleRepository,
  options?: UserServiceOptions,
) {
  const authorLookup = options?.authorLookup;
  const invalidateUserSessions =
    options?.invalidateUserSessions ?? (async () => undefined);
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
        return syncRoleWithAuthorProfile(
          users,
          existing,
          hasAuthorProfile,
          invalidateUserSessions,
        );
      }

      const roleSlug = hasAuthorProfile ? "author" : "reader";
      await assertRoleSlugExists(roles, roleSlug);

      return users.create({
        address: normalized,
        roleSlug,
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
        : false;

      user = await syncRoleWithAuthorProfile(
        users,
        user,
        hasAuthorProfile,
        invalidateUserSessions,
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

      const roleSlug = input.roleSlug ?? "reader";
      const role = await roles.getBySlug(roleSlug);
      if (!role) {
        throw new InvalidUserRoleError(roleSlug);
      }
      assertValidPermissionOverrides(
        roleSlug,
        role.permissions,
        input.permissionOverrides ?? [],
      );

      const metadata = userMetadataSchema.parse(input.metadata ?? {});

      return users.create({
        ...input,
        address: normalized,
        roleSlug,
        metadata,
      });
    },

    async updateUser(user: User): Promise<User> {
      this.assertActive(user);
      const existing = await users.getByAddress(user.address);
      if (!existing) {
        throw new UserNotFoundError(user.address);
      }

      const nextRoleSlug = user.roleSlug;
      const role = await roles.getBySlug(nextRoleSlug);
      if (!role) {
        throw new InvalidUserRoleError(nextRoleSlug);
      }

      if (nextRoleSlug !== existing.roleSlug) {
        await assertValidRoleTransition(user, nextRoleSlug, authorLookup);
      }

      assertValidPermissionOverrides(
        nextRoleSlug,
        role.permissions,
        user.permissionOverrides,
      );

      const validatedUser = {
        ...user,
        metadata: userMetadataSchema.parse(user.metadata ?? {}),
      };

      const updated = await users.update(validatedUser);
      if (user.roleSlug !== existing.roleSlug) {
        await invalidateUserSessions(user.address);
      }
      return updated;
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

      if (user.roleSlug === "admin" || user.roleSlug === "author") {
        return user;
      }

      const updated = await users.update({
        ...user,
        roleSlug: "author",
      });
      await invalidateUserSessions(normalized);
      return updated;
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
