import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  resolveWalletAuth,
  getUserService,
  runListUsersMutation,
  runCreateUserMutation,
  runUpdateUserMutation,
  runDeleteUserMutation,
  enforceActionRateLimit,
  cookiesGet,
} = vi.hoisted(() => ({
  resolveWalletAuth: vi.fn(),
  getUserService: vi.fn(),
  runListUsersMutation: vi.fn(),
  runCreateUserMutation: vi.fn(),
  runUpdateUserMutation: vi.fn(),
  runDeleteUserMutation: vi.fn(),
  enforceActionRateLimit: vi.fn(),
  cookiesGet: vi.fn(),
}));

vi.mock("@/lib/auth/resolve-wallet-auth", () => ({
  resolveWalletAuth,
}));

vi.mock("@/lib/users/server", () => ({
  getUserService,
}));

vi.mock("@/lib/users/user-mutations", () => ({
  buildWalletAuthRequest: vi.fn((auth, method, pathname) => ({
    auth,
    method,
    pathname,
  })),
  runListUsersMutation,
  runCreateUserMutation,
  runUpdateUserMutation,
  runDeleteUserMutation,
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
  createUserAction,
  deleteUserAction,
  listUsersAction,
  updateUserAction,
} from "./users-admin";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";
const TARGET = "0x1111111111111111111111111111111111111111";

const adminUser = {
  address: ADDRESS,
  role: "admin" as const,
  status: "active" as const,
  permissions: [],
  preferences: { declinedAuthorPage: false, onboardingCompletedAt: null },
  metadata: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const signedPayload = {
  address: ADDRESS,
  message: "Andromeda wants you to sign in",
  signature: "0x1234" as `0x${string}`,
};

describe("users admin server actions", () => {
  beforeEach(() => {
    resolveWalletAuth.mockReset();
    getUserService.mockReset();
    runListUsersMutation.mockReset();
    runCreateUserMutation.mockReset();
    runUpdateUserMutation.mockReset();
    runDeleteUserMutation.mockReset();
    enforceActionRateLimit.mockReset();
    cookiesGet.mockReset();
    enforceActionRateLimit.mockResolvedValue(undefined);
    resolveWalletAuth.mockResolvedValue(adminUser);
    getUserService.mockResolvedValue({
      assertActive: vi.fn(),
      list: vi.fn().mockResolvedValue([{ address: TARGET }]),
      getByAddress: vi.fn().mockResolvedValue({ ...adminUser, address: TARGET }),
      createUser: vi.fn().mockResolvedValue({ address: TARGET, role: "reader" }),
      updateUser: vi.fn().mockResolvedValue({ address: TARGET, role: "author" }),
      deleteUser: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("lists users via session without signed input", async () => {
    cookiesGet.mockReturnValue({ value: "session-1" });

    const users = await listUsersAction();

    expect(resolveWalletAuth).toHaveBeenCalledWith({
      sessionId: "session-1",
      walletAuth: null,
    });
    expect(users).toEqual([{ address: TARGET }]);
  });

  it("lists users with wallet auth when no session exists", async () => {
    cookiesGet.mockReturnValue(undefined);
    runListUsersMutation.mockResolvedValue([{ address: TARGET }]);

    const users = await listUsersAction(signedPayload);

    expect(runListUsersMutation).toHaveBeenCalled();
    expect(users).toEqual([{ address: TARGET }]);
  });

  it("creates users with session body only", async () => {
    cookiesGet.mockReturnValue({ value: "session-1" });

    const user = await createUserAction({
      targetAddress: TARGET,
      role: "reader",
      status: "active",
    });

    expect(user.address).toBe(TARGET);
    expect(runCreateUserMutation).not.toHaveBeenCalled();
  });

  it("updates users with session body only", async () => {
    cookiesGet.mockReturnValue({ value: "session-1" });

    const user = await updateUserAction({
      targetAddress: TARGET,
      role: "author",
    });

    expect(user.role).toBe("author");
    expect(runUpdateUserMutation).not.toHaveBeenCalled();
  });

  it("deletes users with session body only", async () => {
    cookiesGet.mockReturnValue({ value: "session-1" });

    await deleteUserAction({ targetAddress: TARGET });

    expect(runDeleteUserMutation).not.toHaveBeenCalled();
  });
});
