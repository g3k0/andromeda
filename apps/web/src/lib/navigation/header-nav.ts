import { defaultPermissionsForRoleSlug } from "@/lib/users/default-role-permissions";
import type { SupportedLocale } from "@/lib/i18n/locales";
import { localizedPath } from "@/lib/i18n/routing";
import { translate } from "@/lib/i18n/translate";
import {
  ABOUT_ROUTE,
  ADMIN_ROUTE,
  CATALOG_ROUTE,
  LIBRARY_ROUTE,
  MY_AUTHOR_PAGE_ROUTE,
  buildAuthorizedNavLinks,
  type RouteNavContext,
} from "./route-guard";
import {
  shouldShowMyAuthorPageMenuItem,
  type RoleMenuContext,
} from "./role-menu";
import { userFromSnapshot } from "./route-guard";
import type { UserSnapshot } from "@/lib/users/types";

export type HeaderNavLink = {
  href: string;
  label: string;
};

export type AuthorizedNavLink = {
  href: string;
  labelKey: string;
};

export type HeaderNavInput = {
  role: string;
  hasAuthorProfile: boolean;
  isConnected?: boolean;
  snapshot?: UserSnapshot | null;
};

export const CATALOG_NAV_LINK = {
  href: CATALOG_ROUTE.href,
  labelKey: CATALOG_ROUTE.labelKey,
};

export const LIBRARY_NAV_LINK = {
  href: LIBRARY_ROUTE.href,
  labelKey: LIBRARY_ROUTE.labelKey,
};

export const ABOUT_NAV_LINK = {
  href: ABOUT_ROUTE.href,
  labelKey: ABOUT_ROUTE.labelKey,
};

export const ADMIN_NAV_LINK = {
  href: ADMIN_ROUTE.href,
  labelKey: ADMIN_ROUTE.labelKey,
};

export const MY_AUTHOR_PAGE_NAV_LINK = {
  href: MY_AUTHOR_PAGE_ROUTE.href,
  labelKey: MY_AUTHOR_PAGE_ROUTE.labelKey,
};

function toRoleMenuContext(input: HeaderNavInput): RoleMenuContext {
  const context = toRouteNavContext(input);

  return {
    roleSlug: context.user?.roleSlug ?? input.role,
    roleName: input.snapshot?.roleName ?? input.role,
    permissions:
      context.user?.permissions ??
      defaultPermissionsForRoleSlug(input.role),
    hasAuthorProfile: context.hasAuthorProfile,
  };
}

export function shouldShowMyAuthorPageLink(
  input: HeaderNavInput,
  _locale: SupportedLocale,
): boolean {
  return shouldShowMyAuthorPageMenuItem(toRoleMenuContext(input));
}

function toRouteNavContext(input: HeaderNavInput): RouteNavContext {
  const isConnected = input.isConnected ?? true;

  if (input.snapshot) {
    return {
      user: userFromSnapshot(input.snapshot),
      hasAuthorProfile: input.snapshot.hasAuthorProfile,
      isConnected,
    };
  }

  return {
    user: {
      roleSlug: input.role,
      permissions: defaultPermissionsForRoleSlug(input.role),
    },
    hasAuthorProfile: input.hasAuthorProfile,
    isConnected,
  };
}

export function buildHeaderNavLinks(
  input: HeaderNavInput,
  locale: SupportedLocale,
): HeaderNavLink[] {
  return buildAuthorizedNavLinks(toRouteNavContext(input)).map((link) => ({
    href: localizedPath(locale, link.href),
    label: translate(locale, link.labelKey),
  }));
}
