import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  runListUsersMutation,
  runCreateUserMutation,
  runUpdateUserMutation,
  runDeleteUserMutation,
  enforceActionRateLimit,
} = vi.hoisted(() => ({
  runListUsersMutation: vi.fn(),
  runCreateUserMutation: vi.fn(),
  runUpdateUserMutation: vi.fn(),
  runDeleteUserMutation: vi.fn(),
  enforceActionRateLimit: vi.fn(),
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

import {
  createUserAction,
  deleteUserAction,
  listUsersAction,
  updateUserAction,
} from "./users-admin";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";
const TARGET = "0x1111111111111111111111111111111111111111";

const signedPayload = {
  address: ADDRESS,
  message: "Andromeda wants you to sign in",
  signature: "0x1234" as `0x${string}`,
};

describe("users admin server actions", () => {
  beforeEach(() => {
    runListUsersMutation.mockReset();
    runCreateUserMutation.mockReset();
    runUpdateUserMutation.mockReset();
    runDeleteUserMutation.mockReset();
    enforceActionRateLimit.mockReset();
    enforceActionRateLimit.mockResolvedValue(undefined);
  });

  it("lists users with wallet auth", async () => {
    runListUsersMutation.mockResolvedValue([{ address: TARGET }]);

    const users = await listUsersAction(signedPayload);

    expect(enforceActionRateLimit).toHaveBeenCalledWith(`list-users:${ADDRESS}`);
    expect(runListUsersMutation).toHaveBeenCalledWith({
      auth: signedPayload,
      method: "GET",
      pathname: "/api/users",
    });
    expect(users).toEqual([{ address: TARGET }]);
  });

  it("creates users with validated payload", async () => {
    runCreateUserMutation.mockResolvedValue({ address: TARGET, role: "reader" });

    const user = await createUserAction({
      ...signedPayload,
      targetAddress: TARGET,
      role: "reader",
      status: "active",
    });

    expect(runCreateUserMutation).toHaveBeenCalledWith({
      ...signedPayload,
      targetAddress: TARGET,
      role: "reader",
      status: "active",
      permissions: [],
    });
    expect(user.address).toBe(TARGET);
  });

  it("updates users by target address", async () => {
    runUpdateUserMutation.mockResolvedValue({
      address: TARGET,
      role: "author",
    });

    const user = await updateUserAction({
      ...signedPayload,
      targetAddress: TARGET,
      role: "author",
    });

    expect(runUpdateUserMutation).toHaveBeenCalledWith(TARGET, {
      address: ADDRESS,
      message: signedPayload.message,
      signature: signedPayload.signature,
      role: "author",
    });
    expect(user.role).toBe("author");
  });

  it("deletes users with wallet auth request", async () => {
    await deleteUserAction({
      ...signedPayload,
      targetAddress: TARGET,
    });

    expect(runDeleteUserMutation).toHaveBeenCalledWith(
      {
        auth: signedPayload,
        method: "DELETE",
        pathname: `/api/users/${TARGET}`,
      },
      TARGET,
    );
  });
});
