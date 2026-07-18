"use client";

import Link from "next/link";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { useLocalizedHref } from "@/lib/i18n/use-localized-href";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  MANAGE_USERS_MENU_ITEM,
  MANAGE_USERS_PATH,
  MY_AUTHOR_PAGE_MENU_ITEM,
  MY_AUTHOR_PAGE_PATH,
  getRoleMenuItems,
  getRoleMenuLabel,
} from "@/lib/navigation/role-menu";
import type { UserPermission } from "@/lib/users/types";
import type { RoleMenuContext } from "@/lib/navigation/role-menu";
import {
  bindOutsideClose,
  closeParentDetails,
} from "./role-menu-dropdown-behavior";

export type RoleMenuDropdownProps = {
  roleSlug: string;
  roleName: string;
  permissions: readonly UserPermission[];
  hasAuthorProfile: boolean;
  onLogout: () => void;
  isLoggingOut?: boolean;
};

function getRoleMenuItemHref(itemId: string): string | null {
  if (itemId === MANAGE_USERS_MENU_ITEM.id) {
    return MANAGE_USERS_PATH;
  }

  if (itemId === MY_AUTHOR_PAGE_MENU_ITEM.id) {
    return MY_AUTHOR_PAGE_PATH;
  }

  return null;
}

export function RoleMenuDropdown({
  roleSlug,
  roleName,
  permissions,
  hasAuthorProfile,
  onLogout,
  isLoggingOut = false,
}: RoleMenuDropdownProps) {
  const menuContext: RoleMenuContext = {
    roleSlug,
    roleName,
    permissions,
    hasAuthorProfile,
  };
  const localizedHref = useLocalizedHref();
  const { t } = useTranslation();
  const menuId = `role-menu-${roleSlug}`;

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
        {getRoleMenuLabel(menuContext)}
        <span aria-hidden className="text-xs text-white/80">
          ▾
        </span>
      </summary>

      <div
        id={menuId}
        role="menu"
        aria-label={`${getRoleMenuLabel(menuContext)} menu`}
        className="absolute right-0 z-20 mt-2 min-w-40 overflow-hidden rounded-lg border border-white/10 bg-[#0b1020] py-1 shadow-lg"
      >
        {getRoleMenuItems(menuContext).map((item) => {
          const href = getRoleMenuItemHref(item.id);

          if (href) {
            return (
              <Link
                key={item.id}
                href={localizedHref(href)}
                role="menuitem"
                onClick={(event) => closeParentDetails(event.currentTarget)}
                className="block w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/5 hover:text-white"
              >
                {t(item.labelKey)}
              </Link>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={(event) => closeParentDetails(event.currentTarget)}
              className="block w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/5 hover:text-white"
            >
              {t(item.labelKey)}
            </button>
          );
        })}

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
            <LoadingSpinner size="sm" label={t("roleMenu.loggingOut")} />
          ) : null}
          {t("roleMenu.logout")}
        </button>
      </div>
    </details>
  );
}
