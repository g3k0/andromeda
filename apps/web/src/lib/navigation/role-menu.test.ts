import { describe, expect, it } from "vitest";
import {
  ROLE_MENU_PLACEHOLDER_ITEMS,
  getRoleMenuLabel,
} from "./role-menu";

describe("role menu", () => {
  it("maps each role to a menu label", () => {
    expect(getRoleMenuLabel("admin")).toBe("Admin");
    expect(getRoleMenuLabel("author")).toBe("Author");
    expect(getRoleMenuLabel("reader")).toBe("Reader");
  });

  it("exposes placeholder dropdown items", () => {
    expect(ROLE_MENU_PLACEHOLDER_ITEMS).toEqual([
      { id: "item-1", label: "item-1" },
      { id: "item-2", label: "item-2" },
    ]);
  });
});
