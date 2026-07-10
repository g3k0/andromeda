import { describe, expect, it } from "vitest";
import { getAdminUserColumns } from "@/lib/i18n/admin-messages";
import { createTranslateFn } from "@/lib/i18n/translate";
import { getEditableAdminUserColumnIds } from "./admin-user-columns";

const t = createTranslateFn("en");

describe("admin user columns", () => {
  it("declares the default admin table columns", () => {
    const columns = getAdminUserColumns(t);
    expect(columns.map((column) => column.id)).toEqual([
      "address",
      "role",
      "status",
      "createdAt",
    ]);
  });

  it("marks role and status as editable", () => {
    expect(getEditableAdminUserColumnIds(getAdminUserColumns(t))).toEqual([
      "role",
      "status",
    ]);
  });
});
