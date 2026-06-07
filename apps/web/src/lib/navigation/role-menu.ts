import type { UserRole } from "@/lib/users/types";

export type RoleMenuItem = {
  id: string;
  label: string;
};

export const ROLE_MENU_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  author: "Author",
  reader: "Reader",
};

export const ROLE_MENU_PLACEHOLDER_ITEMS: RoleMenuItem[] = [
  { id: "item-1", label: "item-1" },
  { id: "item-2", label: "item-2" },
];

export function getRoleMenuLabel(role: UserRole): string {
  return ROLE_MENU_LABELS[role];
}
