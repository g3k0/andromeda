import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { USER_ADMIN_COLUMNS } from "@/lib/users/admin-user-columns";
import {
  formatAdminUserCreatedAt,
  truncateAddress,
} from "@/lib/users/admin-users-mappers";
import type {
  AdminUserRowDraft,
  CreateUserFormState,
} from "@/lib/users/admin-users-state";
import type { AdminUserRow } from "@/lib/users/admin-users-mappers";
import type { UserRole, UserStatus } from "@/lib/users/types";
import { USER_ROLES, USER_STATUSES } from "@/lib/users/types";

export type UsersAdminTableViewProps = {
  rows: AdminUserRow[];
  drafts: AdminUserRowDraft[];
  createForm: CreateUserFormState;
  isLoading: boolean;
  isCreating: boolean;
  showCreateForm: boolean;
  errorMessage: string | null;
  savingAddress: string | null;
  deletingAddress: string | null;
  onToggleCreateForm: () => void;
  onCreateFieldChange: <K extends keyof CreateUserFormState>(
    field: K,
    value: CreateUserFormState[K],
  ) => void;
  onCreateSubmit: () => void;
  onDraftFieldChange: (
    address: string,
    field: "roleSlug" | "status",
    value: string | UserStatus,
  ) => void;
  onSaveRow: (address: string) => void;
  onDeleteRow: (address: string) => void;
  isRowDirty: (row: AdminUserRow, draft: AdminUserRowDraft) => boolean;
};

export function UsersAdminTableView({
  rows,
  drafts,
  createForm,
  isLoading,
  isCreating,
  showCreateForm,
  errorMessage,
  savingAddress,
  deletingAddress,
  onToggleCreateForm,
  onCreateFieldChange,
  onCreateSubmit,
  onDraftFieldChange,
  onSaveRow,
  onDeleteRow,
  isRowDirty,
}: UsersAdminTableViewProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" label="Loading users" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users administration</h1>
          <p className="text-sm text-white/60">
            Manage platform accounts, roles and status.
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleCreateForm}
          className="rounded-lg bg-andromeda px-4 py-2 text-sm font-medium text-white hover:bg-andromeda-dark"
        >
          {showCreateForm ? "Cancel" : "+ Add user"}
        </button>
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {showCreateForm ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onCreateSubmit();
          }}
          className="grid gap-4 rounded-xl border border-white/10 bg-white/5 p-5 sm:grid-cols-4"
        >
          <label className="space-y-1 sm:col-span-2">
            <span className="text-sm text-white/60">Wallet address</span>
            <input
              type="text"
              value={createForm.targetAddress}
              onChange={(event) =>
                onCreateFieldChange("targetAddress", event.target.value)
              }
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm outline-none focus:border-andromeda-light/50"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-white/60">Role</span>
            <select
              value={createForm.roleSlug}
              onChange={(event) =>
                onCreateFieldChange("roleSlug", event.target.value)
              }
              className="w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-sm outline-none focus:border-andromeda-light/50"
            >
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm text-white/60">Status</span>
            <select
              value={createForm.status}
              onChange={(event) =>
                onCreateFieldChange("status", event.target.value as UserStatus)
              }
              className="w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-sm outline-none focus:border-andromeda-light/50"
            >
              {USER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          {createForm.errorMessage ? (
            <p className="text-sm text-red-400 sm:col-span-4" role="alert">
              {createForm.errorMessage}
            </p>
          ) : null}

          <div className="sm:col-span-4">
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center gap-2 rounded-lg bg-andromeda px-4 py-2 text-sm font-medium text-white hover:bg-andromeda-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? (
                <LoadingSpinner size="sm" label="Creating user" />
              ) : null}
              Create user
            </button>
          </div>
        </form>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
          <p className="text-white/70">No users yet.</p>
          <button
            type="button"
            onClick={onToggleCreateForm}
            className="mt-4 rounded-lg bg-andromeda px-4 py-2 text-sm font-medium text-white hover:bg-andromeda-dark"
          >
            Add the first user
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10 text-left text-sm">
            <thead className="bg-white/5 text-white/60">
              <tr>
                {USER_ADMIN_COLUMNS.map((column) => (
                  <th key={column.id} className="px-4 py-3 font-medium">
                    {column.label}
                  </th>
                ))}
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {rows.map((row, index) => {
                const draft = drafts[index];
                const dirty = draft ? isRowDirty(row, draft) : false;

                return (
                  <tr
                    key={row.address}
                    className={dirty ? "bg-andromeda/10" : undefined}
                  >
                    <td className="px-4 py-3 font-mono text-white/80" title={row.address}>
                      {truncateAddress(row.address)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={draft?.roleSlug ?? row.roleSlug}
                        onChange={(event) =>
                          onDraftFieldChange(
                            row.address,
                            "roleSlug",
                            event.target.value,
                          )
                        }
                        className="rounded-lg border border-white/10 bg-[#0b1020] px-2 py-1 text-sm outline-none focus:border-andromeda-light/50"
                      >
                        {USER_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={draft?.status ?? row.status}
                        onChange={(event) =>
                          onDraftFieldChange(
                            row.address,
                            "status",
                            event.target.value as UserStatus,
                          )
                        }
                        className="rounded-lg border border-white/10 bg-[#0b1020] px-2 py-1 text-sm outline-none focus:border-andromeda-light/50"
                      >
                        {USER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      {formatAdminUserCreatedAt(row.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={!dirty || savingAddress === row.address}
                          onClick={() => onSaveRow(row.address)}
                          className="rounded-md border border-white/10 px-3 py-1 text-xs font-medium text-white/80 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {savingAddress === row.address ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          disabled={deletingAddress === row.address}
                          onClick={() => onDeleteRow(row.address)}
                          className="rounded-md border border-red-400/30 px-3 py-1 text-xs font-medium text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {deletingAddress === row.address ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
