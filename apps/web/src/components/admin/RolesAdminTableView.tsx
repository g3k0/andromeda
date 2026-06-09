import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import type {
  AdminRoleRow,
  AdminRoleRowDraft,
  CreateRoleFormState,
} from "@/lib/roles/admin-roles-state";
import { USER_PERMISSIONS } from "@/lib/users/types";
import type { UserPermission } from "@/lib/users/types";

export type RolesAdminTableViewProps = {
  rows: AdminRoleRow[];
  drafts: AdminRoleRowDraft[];
  createForm: CreateRoleFormState;
  isLoading: boolean;
  isCreating: boolean;
  showCreateForm: boolean;
  errorMessage: string | null;
  savingSlug: string | null;
  deletingSlug: string | null;
  onToggleCreateForm: () => void;
  onCreateFieldChange: <K extends keyof CreateRoleFormState>(
    field: K,
    value: CreateRoleFormState[K],
  ) => void;
  onCreatePermissionToggle: (permission: UserPermission) => void;
  onCreateSubmit: () => void;
  onDraftFieldChange: (
    slug: string,
    field: "name" | "description",
    value: string,
  ) => void;
  onDraftPermissionToggle: (slug: string, permission: UserPermission) => void;
  onSaveRow: (slug: string) => void;
  onDeleteRow: (slug: string) => void;
  isRowDirty: (row: AdminRoleRow, draft: AdminRoleRowDraft) => boolean;
};

function PermissionCheckboxes({
  selected,
  onToggle,
  idPrefix,
}: {
  selected: readonly UserPermission[];
  onToggle: (permission: UserPermission) => void;
  idPrefix: string;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {USER_PERMISSIONS.map((permission) => (
        <label
          key={`${idPrefix}-${permission}`}
          className="flex items-center gap-2 text-sm text-white/80"
        >
          <input
            type="checkbox"
            checked={selected.includes(permission)}
            onChange={() => onToggle(permission)}
            className="rounded border-white/20 bg-white/5"
          />
          <span className="font-mono text-xs">{permission}</span>
        </label>
      ))}
    </div>
  );
}

export function RolesAdminTableView({
  rows,
  drafts,
  createForm,
  isLoading,
  isCreating,
  showCreateForm,
  errorMessage,
  savingSlug,
  deletingSlug,
  onToggleCreateForm,
  onCreateFieldChange,
  onCreatePermissionToggle,
  onCreateSubmit,
  onDraftFieldChange,
  onDraftPermissionToggle,
  onSaveRow,
  onDeleteRow,
  isRowDirty,
}: RolesAdminTableViewProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" label="Loading roles" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Roles administration</h2>
          <p className="text-sm text-white/60">
            Configure role names, descriptions and permission sets.
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleCreateForm}
          className="rounded-lg bg-andromeda px-4 py-2 text-sm font-medium text-white hover:bg-andromeda-dark"
        >
          {showCreateForm ? "Cancel" : "+ Add role"}
        </button>
      </div>

      {errorMessage ? (
        <p
          className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      {showCreateForm ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onCreateSubmit();
          }}
          className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="space-y-1">
              <span className="text-sm text-white/60">Slug</span>
              <input
                type="text"
                value={createForm.slug}
                onChange={(event) =>
                  onCreateFieldChange("slug", event.target.value)
                }
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm outline-none focus:border-andromeda-light/50"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm text-white/60">Name</span>
              <input
                type="text"
                value={createForm.name}
                onChange={(event) =>
                  onCreateFieldChange("name", event.target.value)
                }
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-andromeda-light/50"
              />
            </label>

            <label className="space-y-1 sm:col-span-1">
              <span className="text-sm text-white/60">Description</span>
              <input
                type="text"
                value={createForm.description}
                onChange={(event) =>
                  onCreateFieldChange("description", event.target.value)
                }
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-andromeda-light/50"
              />
            </label>
          </div>

          <div>
            <p className="mb-2 text-sm text-white/60">Permissions</p>
            <PermissionCheckboxes
              idPrefix="create"
              selected={createForm.permissions}
              onToggle={onCreatePermissionToggle}
            />
          </div>

          {createForm.errorMessage ? (
            <p className="text-sm text-red-400" role="alert">
              {createForm.errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isCreating}
            className="inline-flex items-center gap-2 rounded-lg bg-andromeda px-4 py-2 text-sm font-medium text-white hover:bg-andromeda-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? <LoadingSpinner size="sm" label="Creating role" /> : null}
            Create role
          </button>
        </form>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
          <p className="text-white/70">No roles yet.</p>
          <button
            type="button"
            onClick={onToggleCreateForm}
            className="mt-4 rounded-lg bg-andromeda px-4 py-2 text-sm font-medium text-white hover:bg-andromeda-dark"
          >
            Add the first role
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((row, index) => {
            const draft = drafts[index];
            const dirty = draft ? isRowDirty(row, draft) : false;

            return (
              <article
                key={row.slug}
                className={[
                  "rounded-xl border border-white/10 p-5",
                  dirty ? "bg-andromeda/10" : "bg-white/5",
                ].join(" ")}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-mono text-sm text-andromeda-light">
                        {row.slug}
                      </h3>
                      {row.isSystem ? (
                        <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs text-white/70">
                          System
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-white/50">
                      {row.userCount} user{row.userCount === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={!dirty || savingSlug === row.slug}
                      onClick={() => onSaveRow(row.slug)}
                      className="rounded-md border border-white/10 px-3 py-1 text-xs font-medium text-white/80 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {savingSlug === row.slug ? "Saving…" : "Save"}
                    </button>
                    {!row.isSystem ? (
                      <button
                        type="button"
                        disabled={deletingSlug === row.slug}
                        onClick={() => onDeleteRow(row.slug)}
                        className="rounded-md border border-red-400/30 px-3 py-1 text-xs font-medium text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {deletingSlug === row.slug ? "Deleting…" : "Delete"}
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-sm text-white/60">Name</span>
                    <input
                      type="text"
                      value={draft?.name ?? row.name}
                      onChange={(event) =>
                        onDraftFieldChange(row.slug, "name", event.target.value)
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-sm outline-none focus:border-andromeda-light/50"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm text-white/60">Description</span>
                    <input
                      type="text"
                      value={draft?.description ?? row.description ?? ""}
                      onChange={(event) =>
                        onDraftFieldChange(
                          row.slug,
                          "description",
                          event.target.value,
                        )
                      }
                      className="w-full rounded-lg border border-white/10 bg-[#0b1020] px-3 py-2 text-sm outline-none focus:border-andromeda-light/50"
                    />
                  </label>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-sm text-white/60">Permissions</p>
                  {draft ? (
                    <PermissionCheckboxes
                      idPrefix={row.slug}
                      selected={draft.permissions}
                      onToggle={(permission) =>
                        onDraftPermissionToggle(row.slug, permission)
                      }
                    />
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
