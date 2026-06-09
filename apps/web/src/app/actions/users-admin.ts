"use server";

import { enforceActionRateLimit } from "@/lib/auth/action-rate-limit";
import {
  createUserActionSchema,
  deleteUserActionSchema,
  listUsersActionSchema,
  updateUserActionSchema,
} from "@/lib/users/schemas";
import type { User } from "@/lib/users/types";
import {
  buildWalletAuthRequest,
  runCreateUserMutation,
  runDeleteUserMutation,
  runListUsersMutation,
  runUpdateUserMutation,
} from "@/lib/users/user-mutations";

export async function listUsersAction(input: unknown): Promise<User[]> {
  const auth = listUsersActionSchema.parse(input);
  await enforceActionRateLimit(`list-users:${auth.address}`);
  return runListUsersMutation(
    buildWalletAuthRequest(auth, "GET", "/api/users"),
  );
}

export async function createUserAction(input: unknown): Promise<User> {
  const body = createUserActionSchema.parse(input);
  await enforceActionRateLimit(`create-user:${body.address}:${body.targetAddress}`);
  return runCreateUserMutation(body);
}

export async function updateUserAction(input: unknown): Promise<User> {
  const body = updateUserActionSchema.parse(input);
  await enforceActionRateLimit(`update-user:${body.address}:${body.targetAddress}`);
  const { targetAddress, ...updateBody } = body;
  return runUpdateUserMutation(targetAddress, updateBody);
}

export async function deleteUserAction(input: unknown): Promise<void> {
  const body = deleteUserActionSchema.parse(input);
  await enforceActionRateLimit(`delete-user:${body.address}:${body.targetAddress}`);
  const { targetAddress, ...auth } = body;
  await runDeleteUserMutation(
    buildWalletAuthRequest(auth, "DELETE", `/api/users/${targetAddress}`),
    targetAddress,
  );
}
