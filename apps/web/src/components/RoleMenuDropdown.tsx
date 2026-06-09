"use client";

import Link from "next/link";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import {
  MANAGE_USERS_MENU_ITEM,
  MANAGE_USERS_PATH,
  getRoleMenuItems,
  getRoleMenuLabel,
} from "@/lib/navigation/role-menu";
import type { UserRole } from "@/lib/users/types";
import {
  bindOutsideClose,
  closeParentDetails,
} from "./role-menu-dropdown-behavior";

export type RoleMenuDropdownProps = {
  role: UserRole;
  onLogout: () => void;
  isLoggingOut?: boolean;
};

export function RoleMenuDropdown({
  role,
  onLogout,
  isLoggingOut = false,
}: RoleMenuDropdownProps) {
  const menuId = `role-menu-${role}`;

  return (
    <details
      ref={(node) => {
        if (!node) {
          return;
        }

        return bindOutsideClose(node);
      }}
      className="group relative"
    >
      <summary
        aria-haspopup="menu"
        aria-controls={menuId}
        className="inline-flex cursor-pointer list-none items-center gap-2 rounded-lg bg-andromeda px-4 py-2 text-sm font-medium text-white marker:content-none hover:bg-andromeda-dark [&::-webkit-details-marker]:hidden"
      >
        {getRoleMenuLabel(role)}
        <span aria-hidden className="text-xs text-white/80">
          ▾
        </span>
      </summary>

      <div
        id={menuId}
        role="menu"
        aria-label={`${getRoleMenuLabel(role)} menu`}
        className="absolute right-0 z-20 mt-2 min-w-40 overflow-hidden rounded-lg border border-white/10 bg-[#0b1020] py-1 shadow-lg"
      >
        {getRoleMenuItems(role).map((item) =>
          item.id === MANAGE_USERS_MENU_ITEM.id ? (
            <Link
              key={item.id}
              href={MANAGE_USERS_PATH}
              role="menuitem"
              onClick={(event) => closeParentDetails(event.currentTarget)}
              className="block w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ) : (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={(event) => closeParentDetails(event.currentTarget)}
              className="block w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </button>
          ),
        )}

        <div className="my-1 border-t border-white/10" />

        <button
          type="button"
          role="menuitem"
          disabled={isLoggingOut}
          className="inline-flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white/80 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          onClick={(event) => {
            closeParentDetails(event.currentTarget);
            onLogout();
          }}
        >
          {isLoggingOut ? (
            <LoadingSpinner size="sm" label="Logging out" />
          ) : null}
          Logout
        </button>
      </div>
    </details>
  );
}
