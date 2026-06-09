"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import {
  createUserAction,
  deleteUserAction,
  listUsersAction,
  updateUserAction,
} from "@/app/actions/users-admin";
import { listRolesAction } from "@/app/actions/roles-admin";
import {
  establishWalletSessionAction,
  getWalletSessionStatusAction,
} from "@/app/actions/wallet-session";
import { useLoading } from "@/components/loading/LoadingProvider";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import { createSignedWalletPayload } from "@/lib/auth/client-wallet-auth";
import {
  syncAdminRowsFromUsers,
  userToAdminRow,
} from "@/lib/users/admin-users-mappers";
import type { AdminUserRow } from "@/lib/users/admin-users-mappers";
import {
  buildUpdateUserPayload,
  createAdminUserRowDraft,
  createDefaultCreateUserFormState,
  isAdminUserRowDirty,
  updateRowDraftField,
  validateCreateUserForm,
  type AdminUserRowDraft,
  type CreateUserFormState,
} from "@/lib/users/admin-users-state";
import type { UserRole, UserStatus } from "@/lib/users/types";
import {
  adminSessionErrorMessage,
  ensureAdminSession,
} from "./admin-users-session";
import type { AdminRoleOption } from "./UsersAdminTableView";
import { UsersAdminTableView } from "./UsersAdminTableView";

export function UsersAdminPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { runWithLoading } = useLoading();
  const { notify } = useNotifications();

  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [drafts, setDrafts] = useState<AdminUserRowDraft[]>([]);
  const [createForm, setCreateForm] = useState<CreateUserFormState>(
    createDefaultCreateUserFormState(),
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [savingAddress, setSavingAddress] = useState<string | null>(null);
  const [deletingAddress, setDeletingAddress] = useState<string | null>(null);
  const [roleOptions, setRoleOptions] = useState<AdminRoleOption[]>([]);

  const existingAddresses = useMemo(
    () => rows.map((row) => row.address),
    [rows],
  );

  const sessionDeps = useMemo(
    () => ({
      getStatus: getWalletSessionStatusAction,
      sign: createSignedWalletPayload,
      establish: establishWalletSessionAction,
    }),
    [],
  );

  const authorizeAdminSession = useCallback(async () => {
    if (!address) {
      return;
    }
    await ensureAdminSession(address, signMessageAsync, sessionDeps);
  }, [address, sessionDeps, signMessageAsync]);

  const loadUsers = useCallback(async () => {
    if (!address || !isConnected) {
      setRows([]);
      setDrafts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await authorizeAdminSession();
      const [users, roles] = await Promise.all([
        listUsersAction(),
        listRolesAction(),
      ]);
      const synced = syncAdminRowsFromUsers(users);
      setRows(synced.rows);
      setDrafts(synced.drafts);
      setRoleOptions(
        roles.map((role) => ({ slug: role.slug, name: role.name })),
      );
    } catch (error) {
      setErrorMessage(adminSessionErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [address, authorizeAdminSession, isConnected]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  function handleDraftFieldChange(
    rowAddress: string,
    field: "roleSlug" | "status",
    value: string | UserStatus,
  ) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.address === rowAddress
          ? updateRowDraftField(draft, field, value)
          : draft,
      ),
    );
  }

  async function handleSaveRow(rowAddress: string) {
    const rowIndex = rows.findIndex((row) => row.address === rowAddress);
    const draft = drafts[rowIndex];
    if (!draft || !isAdminUserRowDirty(rows[rowIndex], draft)) {
      return;
    }

    setSavingAddress(rowAddress);
    setErrorMessage(null);

    try {
      await runWithLoading(async () => {
        const updated = await updateUserAction(buildUpdateUserPayload(draft));
        const updatedRow = userToAdminRow(updated);
        setRows((current) =>
          current.map((row) =>
            row.address === updated.address ? updatedRow : row,
          ),
        );
        setDrafts((current) =>
          current.map((item) =>
            item.address === updated.address
              ? createAdminUserRowDraft(updatedRow)
              : item,
          ),
        );
        notify({ message: "User updated.", variant: "success" });
      }, "Saving user…");
    } catch {
      setErrorMessage("Failed to update user.");
    } finally {
      setSavingAddress(null);
    }
  }

  async function handleDeleteRow(rowAddress: string) {
    if (!window.confirm(`Delete user ${rowAddress}? This cannot be undone.`)) {
      return;
    }

    setDeletingAddress(rowAddress);
    setErrorMessage(null);

    try {
      await runWithLoading(async () => {
        await deleteUserAction({ targetAddress: rowAddress });
        setRows((current) => current.filter((row) => row.address !== rowAddress));
        setDrafts((current) =>
          current.filter((draft) => draft.address !== rowAddress),
        );
        notify({ message: "User deleted.", variant: "success" });
      }, "Deleting user…");
    } catch {
      setErrorMessage("Failed to delete user.");
    } finally {
      setDeletingAddress(null);
    }
  }

  async function handleCreateSubmit() {
    const validationError = validateCreateUserForm(createForm, existingAddresses);
    if (validationError) {
      setCreateForm((current) => ({
        ...current,
        errorMessage: validationError,
      }));
      return;
    }

    setIsCreating(true);
    setCreateForm((current) => ({ ...current, errorMessage: null }));
    setErrorMessage(null);

    try {
      await runWithLoading(async () => {
        const created = await createUserAction({
          targetAddress: createForm.targetAddress.trim(),
          roleSlug: createForm.roleSlug,
          status: createForm.status,
        });
        const createdRow = userToAdminRow(created);
        setRows((current) =>
          [...current, createdRow].sort((left, right) =>
            right.createdAt.localeCompare(left.createdAt),
          ),
        );
        setDrafts((current) => [...current, createAdminUserRowDraft(createdRow)]);
        setCreateForm(createDefaultCreateUserFormState());
        setShowCreateForm(false);
        notify({ message: "User created.", variant: "success" });
      }, "Creating user…");
    } catch {
      setCreateForm((current) => ({
        ...current,
        errorMessage: "Failed to create user.",
      }));
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <UsersAdminTableView
      roleOptions={roleOptions}
      rows={rows}
      drafts={drafts}
      createForm={createForm}
      isLoading={isLoading}
      isCreating={isCreating}
      showCreateForm={showCreateForm}
      errorMessage={errorMessage}
      savingAddress={savingAddress}
      deletingAddress={deletingAddress}
      onToggleCreateForm={() => setShowCreateForm((current) => !current)}
      onCreateFieldChange={(field, value) =>
        setCreateForm((current) => ({
          ...current,
          [field]: value,
          errorMessage: null,
        }))
      }
      onCreateSubmit={() => void handleCreateSubmit()}
      onDraftFieldChange={handleDraftFieldChange}
      onSaveRow={(rowAddress) => void handleSaveRow(rowAddress)}
      onDeleteRow={(rowAddress) => void handleDeleteRow(rowAddress)}
      isRowDirty={isAdminUserRowDirty}
    />
  );
}
