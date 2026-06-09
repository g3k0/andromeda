/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AdminUserRow } from "@/lib/users/admin-users-mappers";
import {
  createAdminUserRowDraft,
  createDefaultCreateUserFormState,
  isAdminUserRowDirty,
} from "@/lib/users/admin-users-state";
import { UsersAdminTableView } from "./UsersAdminTableView";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

function buildRow(): AdminUserRow {
  return {
    address: ADDRESS,
    roleSlug: "reader",
    status: "active",
    createdAt: "2026-01-15T10:00:00.000Z",
  };
}

const ROLE_OPTIONS = [
  { slug: "reader", name: "Reader" },
  { slug: "author", name: "Author" },
  { slug: "admin", name: "Admin" },
] as const;

function renderView(overrides: Partial<Parameters<typeof UsersAdminTableView>[0]> = {}) {
  const rows = overrides.rows ?? [buildRow()];
  const drafts = overrides.drafts ?? rows.map(createAdminUserRowDraft);

  return render(
    <UsersAdminTableView
      roleOptions={ROLE_OPTIONS}
      rows={rows}
      drafts={drafts}
      createForm={createDefaultCreateUserFormState()}
      isLoading={false}
      isCreating={false}
      showCreateForm={false}
      errorMessage={null}
      savingAddress={null}
      deletingAddress={null}
      onToggleCreateForm={vi.fn()}
      onCreateFieldChange={vi.fn()}
      onCreateSubmit={vi.fn()}
      onDraftFieldChange={vi.fn()}
      onSaveRow={vi.fn()}
      onDeleteRow={vi.fn()}
      isRowDirty={isAdminUserRowDirty}
      {...overrides}
    />,
  );
}

describe("UsersAdminTableView", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a loading state", () => {
    renderView({ isLoading: true, rows: [] });

    expect(screen.getByLabelText("Loading users")).toBeInTheDocument();
  });

  it("renders users in the table", () => {
    renderView();

    expect(screen.getByRole("columnheader", { name: "Role" })).toBeInTheDocument();
    expect(screen.getByText("0xabcdef…cdef01")).toBeInTheDocument();
    expect(screen.getByText("2026-01-15")).toBeInTheDocument();
  });

  it("shows the create-user form when requested", async () => {
    const user = userEvent.setup();
    const onToggleCreateForm = vi.fn();

    renderView({ showCreateForm: true, onToggleCreateForm });

    expect(screen.getByLabelText(/wallet address/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onToggleCreateForm).toHaveBeenCalled();
  });
});
