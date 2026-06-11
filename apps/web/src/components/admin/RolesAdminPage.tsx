"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import {
  createRoleAction,
  deleteRoleAction,
  listRolesAction,
  updateRoleAction,
} from "@/app/actions/roles-admin";
import {
  establishWalletSessionAction,
  getWalletSessionStatusAction,
  isAdminWalletSessionReadyAction,
} from "@/app/actions/wallet-session";
import { useLoading } from "@/components/loading/LoadingProvider";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import { createSignedWalletPayload } from "@/lib/auth/client-wallet-auth";
import {
  buildCreateRolePayload,
  buildUpdateRolePayload,
  createAdminRoleRowDraft,
  createDefaultCreateRoleFormState,
  isAdminRoleRowDirty,
  roleToAdminRow,
  syncAdminRowsFromRoles,
  toggleRoleDraftPermission,
  validateCreateRoleForm,
  type AdminRoleRow,
  type AdminRoleRowDraft,
  type CreateRoleFormState,
} from "@/lib/roles/admin-roles-state";
import type { UserPermission } from "@/lib/users/types";
import {
  adminSessionErrorMessage,
  ensureAdminSession,
} from "./admin-users-session";
import { RolesAdminTableView } from "./RolesAdminTableView";

function updateRoleRowDraftField(
  draft: AdminRoleRowDraft,
  field: "name" | "description",
  value: string,
): AdminRoleRowDraft {
  return { ...draft, [field]: value };
}

export function RolesAdminPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { runWithLoading } = useLoading();
  const { notify } = useNotifications();

  const [rows, setRows] = useState<AdminRoleRow[]>([]);
  const [drafts, setDrafts] = useState<AdminRoleRowDraft[]>([]);
  const [createForm, setCreateForm] = useState<CreateRoleFormState>(
    createDefaultCreateRoleFormState(),
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const existingSlugs = useMemo(() => rows.map((row) => row.slug), [rows]);

  const sessionDeps = useMemo(
    () => ({
      getStatus: getWalletSessionStatusAction,
      isReady: isAdminWalletSessionReadyAction,
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

  const loadRoles = useCallback(async () => {
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
      const roles = await listRolesAction();
      const synced = syncAdminRowsFromRoles(roles);
      setRows(synced.rows);
      setDrafts(synced.drafts);
    } catch (error) {
      setErrorMessage(adminSessionErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [address, authorizeAdminSession, isConnected]);

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  function handleDraftFieldChange(
    slug: string,
    field: "name" | "description",
    value: string,
  ) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.slug === slug ? updateRoleRowDraftField(draft, field, value) : draft,
      ),
    );
  }

  function handleDraftPermissionToggle(slug: string, permission: UserPermission) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.slug === slug
          ? toggleRoleDraftPermission(draft, permission)
          : draft,
      ),
    );
  }

  async function handleSaveRow(slug: string) {
    const rowIndex = rows.findIndex((row) => row.slug === slug);
    const draft = drafts[rowIndex];
    if (!draft || !isAdminRoleRowDirty(rows[rowIndex], draft)) {
      return;
    }

    setSavingSlug(slug);
    setErrorMessage(null);

    try {
      await runWithLoading(async () => {
        const updated = await updateRoleAction(buildUpdateRolePayload(draft));
        const updatedRow = roleToAdminRow(updated);
        setRows((current) =>
          current.map((row) => (row.slug === updated.slug ? updatedRow : row)),
        );
        setDrafts((current) =>
          current.map((item) =>
            item.slug === updated.slug
              ? createAdminRoleRowDraft(updatedRow)
              : item,
          ),
        );
        notify({ message: "Role updated.", variant: "success" });
      }, "Saving role…");
    } catch {
      setErrorMessage("Failed to update role.");
    } finally {
      setSavingSlug(null);
    }
  }

  async function handleDeleteRow(slug: string) {
    if (!window.confirm(`Delete role ${slug}? This cannot be undone.`)) {
      return;
    }

    setDeletingSlug(slug);
    setErrorMessage(null);

    try {
      await runWithLoading(async () => {
        await deleteRoleAction({ slug });
        setRows((current) => current.filter((row) => row.slug !== slug));
        setDrafts((current) => current.filter((draft) => draft.slug !== slug));
        notify({ message: "Role deleted.", variant: "success" });
      }, "Deleting role…");
    } catch {
      setErrorMessage("Failed to delete role.");
    } finally {
      setDeletingSlug(null);
    }
  }

  async function handleCreateSubmit() {
    const validationError = validateCreateRoleForm(createForm, existingSlugs);
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
        const created = await createRoleAction(buildCreateRolePayload(createForm));
        const createdRow = roleToAdminRow(created);
        setRows((current) =>
          [...current, createdRow].sort((left, right) =>
            left.slug.localeCompare(right.slug),
          ),
        );
        setDrafts((current) => [...current, createAdminRoleRowDraft(createdRow)]);
        setCreateForm(createDefaultCreateRoleFormState());
        setShowCreateForm(false);
        notify({ message: "Role created.", variant: "success" });
      }, "Creating role…");
    } catch {
      setCreateForm((current) => ({
        ...current,
        errorMessage: "Failed to create role.",
      }));
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <RolesAdminTableView
      rows={rows}
      drafts={drafts}
      createForm={createForm}
      isLoading={isLoading}
      isCreating={isCreating}
      showCreateForm={showCreateForm}
      errorMessage={errorMessage}
      savingSlug={savingSlug}
      deletingSlug={deletingSlug}
      onToggleCreateForm={() => setShowCreateForm((current) => !current)}
      onCreateFieldChange={(field, value) =>
        setCreateForm((current) => ({
          ...current,
          [field]: value,
          errorMessage: null,
        }))
      }
      onCreatePermissionToggle={(permission) =>
        setCreateForm((current) => ({
          ...current,
          permissions: toggleRoleDraftPermission(
            {
              slug: "",
              name: "",
              description: "",
              permissions: current.permissions,
            },
            permission,
          ).permissions,
          errorMessage: null,
        }))
      }
      onCreateSubmit={() => void handleCreateSubmit()}
      onDraftFieldChange={handleDraftFieldChange}
      onDraftPermissionToggle={handleDraftPermissionToggle}
      onSaveRow={(slug) => void handleSaveRow(slug)}
      onDeleteRow={(slug) => void handleDeleteRow(slug)}
      isRowDirty={isAdminRoleRowDirty}
    />
  );
}
