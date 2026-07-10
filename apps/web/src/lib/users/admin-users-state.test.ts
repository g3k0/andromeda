import { describe, expect, it } from "vitest";
import { createTranslateFn } from "@/lib/i18n/translate";
import {
  buildUpdateUserPayload,
  createAdminUserRowDraft,
  createDefaultCreateUserFormState,
  createInitialRowDrafts,
  hasDirtyAdminUserRows,
  isAdminUserRowDirty,
  isRoleSlugValue,
  isUserStatusValue,
  updateRowDraftField,
  validateCreateUserForm,
} from "./admin-users-state";
import type { AdminUserRow } from "./admin-users-mappers";

const t = createTranslateFn("en");

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";
const OTHER = "0x1111111111111111111111111111111111111111";

function buildRow(overrides: Partial<AdminUserRow> = {}): AdminUserRow {
  return {
    address: ADDRESS,
    roleSlug: "reader",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("admin users state", () => {
  it("tracks dirty rows when role or status changes", () => {
    const rows = [buildRow(), buildRow({ address: OTHER, roleSlug: "admin" })];
    const drafts = createInitialRowDrafts(rows);

    expect(isAdminUserRowDirty(rows[0], drafts[0])).toBe(false);
    expect(hasDirtyAdminUserRows(rows, drafts)).toBe(false);

    const updatedDraft = updateRowDraftField(drafts[0], "roleSlug", "author");
    expect(isAdminUserRowDirty(rows[0], updatedDraft)).toBe(true);
    expect(hasDirtyAdminUserRows(rows, [updatedDraft, drafts[1]])).toBe(true);
  });

  it("validates create-user form input", () => {
    const form = {
      ...createDefaultCreateUserFormState(),
      targetAddress: ADDRESS,
    };

    expect(validateCreateUserForm(form, [], t)).toBeNull();
    expect(validateCreateUserForm(form, [ADDRESS], t)).toBe(
      "A user with this address already exists.",
    );
    expect(
      validateCreateUserForm(
        { ...form, targetAddress: "not-an-address" },
        [],
        t,
      ),
    ).toBe("Invalid Ethereum address.");
  });

  it("builds update payloads from row drafts", () => {
    const draft = createAdminUserRowDraft(
      buildRow({ roleSlug: "author", status: "suspended" }),
    );

    expect(buildUpdateUserPayload(draft)).toEqual({
      targetAddress: ADDRESS,
      roleSlug: "author",
      status: "suspended",
    });
  });

  it("recognizes role slug and status enum values", () => {
    expect(isRoleSlugValue("admin")).toBe(true);
    expect(isRoleSlugValue(" ")).toBe(false);
    expect(isUserStatusValue("pending")).toBe(true);
    expect(isUserStatusValue("banned")).toBe(false);
  });
});
