import { describe, expect, it } from "vitest";
import {
  BECOME_AUTHOR_MENU_ITEM,
  CHANGE_LANGUAGE_MENU_ITEM,
  MANAGE_USERS_MENU_ITEM,
  PROFILE_SETTINGS_MENU_ITEM,
  getRoleMenuItems,
  getRoleMenuLabel,
  shouldShowBecomeAuthorMenuItem,
  shouldShowManageUsersMenuItem,
} from "./role-menu";

describe("role menu", () => {
  it("maps each role to a menu label", () => {
    expect(getRoleMenuLabel("admin")).toBe("Admin");
    expect(getRoleMenuLabel("author")).toBe("Author");
    expect(getRoleMenuLabel("reader")).toBe("Reader");
  });

  it("shows become-author only for readers", () => {
    expect(shouldShowBecomeAuthorMenuItem("reader")).toBe(true);
    expect(shouldShowBecomeAuthorMenuItem("author")).toBe(false);
    expect(shouldShowBecomeAuthorMenuItem("admin")).toBe(false);
  });

  it("shows manage-users only for admins", () => {
    expect(shouldShowManageUsersMenuItem("admin")).toBe(true);
    expect(shouldShowManageUsersMenuItem("author")).toBe(false);
    expect(shouldShowManageUsersMenuItem("reader")).toBe(false);
  });

  it("builds role-specific menu items", () => {
    expect(getRoleMenuItems("reader")).toEqual([
      PROFILE_SETTINGS_MENU_ITEM,
      CHANGE_LANGUAGE_MENU_ITEM,
      BECOME_AUTHOR_MENU_ITEM,
    ]);
    expect(getRoleMenuItems("author")).toEqual([
      PROFILE_SETTINGS_MENU_ITEM,
      CHANGE_LANGUAGE_MENU_ITEM,
    ]);
    expect(getRoleMenuItems("admin")).toEqual([
      PROFILE_SETTINGS_MENU_ITEM,
      CHANGE_LANGUAGE_MENU_ITEM,
      MANAGE_USERS_MENU_ITEM,
    ]);
  });
});
