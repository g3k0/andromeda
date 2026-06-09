/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createAdminRoleRowDraft,
  createDefaultCreateRoleFormState,
  isAdminRoleRowDirty,
} from "@/lib/roles/admin-roles-state";
import type { AdminRoleRow } from "@/lib/roles/admin-roles-state";
import { RolesAdminTableView } from "./RolesAdminTableView";

function buildRow(): AdminRoleRow {
  return {
    slug: "moderator",
    name: "Moderator",
    description: "Reviews content",
    permissions: ["pages:read"],
    isSystem: false,
    userCount: 1,
  };
}

function renderView(
  overrides: Partial<Parameters<typeof RolesAdminTableView>[0]> = {},
) {
  const rows = overrides.rows ?? [buildRow()];
  const drafts = overrides.drafts ?? rows.map(createAdminRoleRowDraft);

  return render(
    <RolesAdminTableView
      rows={rows}
      drafts={drafts}
      createForm={createDefaultCreateRoleFormState()}
      isLoading={false}
      isCreating={false}
      showCreateForm={false}
      errorMessage={null}
      savingSlug={null}
      deletingSlug={null}
      onToggleCreateForm={vi.fn()}
      onCreateFieldChange={vi.fn()}
      onCreatePermissionToggle={vi.fn()}
      onCreateSubmit={vi.fn()}
      onDraftFieldChange={vi.fn()}
      onDraftPermissionToggle={vi.fn()}
      onSaveRow={vi.fn()}
      onDeleteRow={vi.fn()}
      isRowDirty={isAdminRoleRowDirty}
      {...overrides}
    />,
  );
}

describe("RolesAdminTableView", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a loading state", () => {
    renderView({ isLoading: true, rows: [] });

    expect(screen.getByLabelText("Loading roles")).toBeInTheDocument();
  });

  it("renders roles with system badge and delete action", () => {
    renderView({
      rows: [{ ...buildRow(), isSystem: true }],
    });

    expect(screen.getByText("moderator")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("shows the create-role form when requested", async () => {
    const user = userEvent.setup();
    const onToggleCreateForm = vi.fn();

    renderView({ showCreateForm: true, onToggleCreateForm });

    expect(screen.getByLabelText(/^slug$/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onToggleCreateForm).toHaveBeenCalled();
  });
});
