import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildAuthenticatedUser } from "@/lib/users/testing/build-authenticated-user";

const {
  getAuth,
  requireAuth,
  verifyAuth,
  refreshWalletSessionFromDb,
  getRoleService,
  runListRolesMutation,
  runCreateRoleMutation,
  runUpdateRoleMutation,
  runDeleteRoleMutation,
  enforceActionRateLimit,
  cookiesGet,
} = vi.hoisted(() => ({
  getAuth: vi.fn(),
  requireAuth: vi.fn(),
  verifyAuth: vi.fn(),
  refreshWalletSessionFromDb: vi.fn(),
  getRoleService: vi.fn(),
  runListRolesMutation: vi.fn(),
  runCreateRoleMutation: vi.fn(),
  runUpdateRoleMutation: vi.fn(),
  runDeleteRoleMutation: vi.fn(),
  enforceActionRateLimit: vi.fn(),
  cookiesGet: vi.fn(),
}));

vi.mock("@/lib/auth/require-auth", () => ({
  getAuth,
  requireAuth,
  verifyAuth,
  checkAuth: vi.fn(),
}));

vi.mock("@/lib/auth/refresh-wallet-session", () => ({
  refreshWalletSessionFromDb,
}));

vi.mock("@/lib/roles/server", () => ({
  getRoleService,
}));

vi.mock("@/lib/roles/role-mutations", () => ({
  runListRolesMutation,
  runCreateRoleMutation,
  runUpdateRoleMutation,
  runDeleteRoleMutation,
}));

vi.mock("@/lib/auth/action-rate-limit", () => ({
  enforceActionRateLimit,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: cookiesGet,
  })),
}));

import {
  createRoleAction,
  deleteRoleAction,
  listRolesAction,
  updateRoleAction,
} from "./roles-admin";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";
const adminUser = buildAuthenticatedUser(ADDRESS, "admin");

const role = {
  slug: "moderator",
  name: "Moderator",
  description: null,
  permissions: ["pages:read"] as const,
  isSystem: false,
  userCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("roles admin server actions", () => {
  beforeEach(() => {
    getAuth.mockReset();
    requireAuth.mockReset();
    verifyAuth.mockReset();
    refreshWalletSessionFromDb.mockReset();
    getRoleService.mockReset();
    runListRolesMutation.mockReset();
    runCreateRoleMutation.mockReset();
    runUpdateRoleMutation.mockReset();
    runDeleteRoleMutation.mockReset();
    enforceActionRateLimit.mockReset();
    cookiesGet.mockReset();
    enforceActionRateLimit.mockResolvedValue(undefined);
    refreshWalletSessionFromDb.mockResolvedValue(null);
    getAuth.mockResolvedValue(adminUser);
    requireAuth.mockResolvedValue(adminUser);
    verifyAuth.mockResolvedValue(ADDRESS);
    getRoleService.mockResolvedValue({
      list: vi.fn().mockResolvedValue([role]),
      createRole: vi.fn().mockResolvedValue(role),
      updateRole: vi.fn().mockResolvedValue(role),
      getBySlug: vi.fn().mockResolvedValue(role),
      deleteRole: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("lists roles via session without signed input", async () => {
    cookiesGet.mockReturnValue({ value: "session-1" });
    const roles = await listRolesAction();
    expect(refreshWalletSessionFromDb).toHaveBeenCalledWith("session-1");
    expect(roles).toEqual([role]);
    expect(runListRolesMutation).not.toHaveBeenCalled();
  });

  it("creates roles with session body only", async () => {
    cookiesGet.mockReturnValue({ value: "session-1" });
    const created = await createRoleAction({
      slug: "moderator",
      name: "Moderator",
      permissions: ["pages:read"],
    });
    expect(created.slug).toBe("moderator");
    expect(runCreateRoleMutation).not.toHaveBeenCalled();
  });

  it("updates roles with session body only", async () => {
    cookiesGet.mockReturnValue({ value: "session-1" });
    const updated = await updateRoleAction({
      slug: "moderator",
      name: "Curator",
    });
    expect(updated.name).toBe("Moderator");
    expect(runUpdateRoleMutation).not.toHaveBeenCalled();
  });

  it("deletes roles with session body only", async () => {
    cookiesGet.mockReturnValue({ value: "session-1" });
    await deleteRoleAction({ slug: "moderator" });
    expect(runDeleteRoleMutation).not.toHaveBeenCalled();
  });
});
