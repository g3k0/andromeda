import { describe, expect, it } from "vitest";
import {
  buildUpdateUserPayload,
  createAdminUserRowDraft,
  createDefaultCreateUserFormState,
  createInitialRowDrafts,
  hasDirtyAdminUserRows,
  isAdminUserRowDirty,
  isUserRoleValue,
  isUserStatusValue,
  updateRowDraftField,
  validateCreateUserForm,
} from "./admin-users-state";
import type { AdminUserRow } from "./admin-users-mappers";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";
const OTHER = "0x1111111111111111111111111111111111111111";

function buildRow(overrides: Partial<AdminUserRow> = {}): AdminUserRow {
  return {
    address: ADDRESS,
    role: "reader",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("admin users state", () => {
  it("tracks dirty rows when role or status changes", () => {
    const rows = [buildRow(), buildRow({ address: OTHER, role: "admin" })];
    const drafts = createInitialRowDrafts(rows);

    expect(isAdminUserRowDirty(rows[0], drafts[0])).toBe(false);
    expect(hasDirtyAdminUserRows(rows, drafts)).toBe(false);

    const updatedDraft = updateRowDraftField(drafts[0], "role", "author");
    expect(isAdminUserRowDirty(rows[0], updatedDraft)).toBe(true);
    expect(hasDirtyAdminUserRows(rows, [updatedDraft, drafts[1]])).toBe(true);
  });

  it("validates create-user form input", () => {
    const form = {
      ...createDefaultCreateUserFormState(),
      targetAddress: ADDRESS,
    };

    expect(validateCreateUserForm(form, [])).toBeNull();
    expect(validateCreateUserForm(form, [ADDRESS])).toBe(
      "A user with this address already exists.",
    );
    expect(
      validateCreateUserForm(
        { ...form, targetAddress: "not-an-address" },
        [],
      ),
    ).toBe("Invalid Ethereum address.");
  });

  it("builds update payloads from row drafts", () => {
    const draft = createAdminUserRowDraft(
      buildRow({ role: "author", status: "suspended" }),
    );

    expect(buildUpdateUserPayload(draft)).toEqual({
      targetAddress: ADDRESS,
      role: "author",
      status: "suspended",
    });
  });

  it("recognizes role and status enum values", () => {
    expect(isUserRoleValue("admin")).toBe(true);
    expect(isUserRoleValue("moderator")).toBe(false);
    expect(isUserStatusValue("pending")).toBe(true);
    expect(isUserStatusValue("banned")).toBe(false);
  });
});
