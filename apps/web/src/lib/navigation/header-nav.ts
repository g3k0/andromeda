import { defaultPermissionsForRoleSlug } from "@/lib/users/default-role-permissions";
import {
  ABOUT_ROUTE,
  ADMIN_ROUTE,
  CATALOG_ROUTE,
  LIBRARY_ROUTE,
  MY_AUTHOR_PAGE_ROUTE,
  buildAuthorizedNavLinks,
  type RouteNavContext,
} from "./route-guard";
import { userFromSnapshot } from "./route-guard";
import type { UserSnapshot } from "@/lib/users/types";

export type HeaderNavLink = {
  href: string;
  label: string;
};

export type HeaderNavInput = {
  role: string;
  hasAuthorProfile: boolean;
  isConnected?: boolean;
  snapshot?: UserSnapshot | null;
};

export const CATALOG_NAV_LINK = {
  href: CATALOG_ROUTE.href,
  label: CATALOG_ROUTE.label,
};

export const LIBRARY_NAV_LINK = {
  href: LIBRARY_ROUTE.href,
  label: LIBRARY_ROUTE.label,
};

export const ABOUT_NAV_LINK = {
  href: ABOUT_ROUTE.href,
  label: ABOUT_ROUTE.label,
};

export const ADMIN_NAV_LINK = {
  href: ADMIN_ROUTE.href,
  label: ADMIN_ROUTE.label,
};

export const MY_AUTHOR_PAGE_NAV_LINK = {
  href: MY_AUTHOR_PAGE_ROUTE.href,
  label: MY_AUTHOR_PAGE_ROUTE.label,
};

export function shouldShowMyAuthorPageLink(input: HeaderNavInput): boolean {
  return buildHeaderNavLinks(input).some(
    (link) => link.href === MY_AUTHOR_PAGE_ROUTE.href,
  );
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

export function buildHeaderNavLinks(input: HeaderNavInput): HeaderNavLink[] {
  return buildAuthorizedNavLinks(toRouteNavContext(input));
}
