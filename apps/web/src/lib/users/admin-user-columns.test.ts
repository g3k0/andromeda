import { describe, expect, it } from "vitest";
import {
  USER_ADMIN_COLUMNS,
  getEditableAdminUserColumnIds,
} from "./admin-user-columns";

describe("admin user columns", () => {
  it("declares the default admin table columns", () => {
    expect(USER_ADMIN_COLUMNS.map((column) => column.id)).toEqual([
      "address",
      "role",
      "status",
      "createdAt",
    ]);
  });

  it("marks role and status as editable", () => {
    expect(getEditableAdminUserColumnIds()).toEqual(["role", "status"]);
  });
});
