import { hasPermission } from "@/lib/users/permissions";
import type { PermissionSubject } from "@/lib/users/permissions";
import type { UserPermission, UserSnapshot } from "@/lib/users/types";
import { defaultUserPreferences } from "@/lib/users/types";
import { stripLocalePrefix } from "@/lib/i18n/routing";
import type { AuthorizedNavLink } from "./header-nav";

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type RouteDefinition = {
  id: string;
  href: string;
  labelKey: string;
  pagePermission: UserPermission;
  showInNav?: (context: RouteNavContext) => boolean;
};

export type ApiRouteDefinition = {
  id: string;
  methods: HttpMethod[];
  pathPattern: string;
  permission: UserPermission;
};

export type RouteNavContext = {
  user: PermissionSubject & { roleSlug?: string } | null;
  hasAuthorProfile: boolean;
  isConnected: boolean;
};

export const CATALOG_ROUTE: RouteDefinition = {
  id: "catalog",
  href: "/works",
  labelKey: "nav.catalog",
  pagePermission: "pages:read",
};

export const LIBRARY_ROUTE: RouteDefinition = {
  id: "library",
  href: "/library",
  labelKey: "nav.library",
  pagePermission: "pages:read",
};

export const ABOUT_ROUTE: RouteDefinition = {
  id: "about",
  href: "/about",
  labelKey: "nav.about",
  pagePermission: "pages:read",
};

export const ADMIN_ROUTE: RouteDefinition = {
  id: "admin",
  href: "/admin",
  labelKey: "nav.admin",
  pagePermission: "admin:access",
  showInNav: () => false,
};

export const MY_AUTHOR_PAGE_ROUTE: RouteDefinition = {
  id: "my-author-page",
  href: "/author",
  labelKey: "nav.myPage",
  pagePermission: "pages:read",
  showInNav: ({ user, hasAuthorProfile }) => {
    if (!hasAuthorProfile) {
      return false;
    }
    return user?.roleSlug === "author" || user?.roleSlug === "admin";
  },
};

export const APP_ROUTES: RouteDefinition[] = [
  CATALOG_ROUTE,
  LIBRARY_ROUTE,
  ABOUT_ROUTE,
  ADMIN_ROUTE,
  MY_AUTHOR_PAGE_ROUTE,
];

export const API_ROUTES: ApiRouteDefinition[] = [
  {
    id: "users-list",
    methods: ["GET"],
    pathPattern: "/api/users",
    permission: "users:read",
  },
  {
    id: "users-create",
    methods: ["POST"],
    pathPattern: "/api/users",
    permission: "users:write",
  },
  {
    id: "users-read",
    methods: ["GET"],
    pathPattern: "/api/users/:address",
    permission: "users:read",
  },
  {
    id: "users-update",
    methods: ["PATCH"],
    pathPattern: "/api/users/:address",
    permission: "users:write",
  },
  {
    id: "users-delete",
    methods: ["DELETE"],
    pathPattern: "/api/users/:address",
    permission: "users:delete",
  },
  {
    id: "authors-create",
    methods: ["POST"],
    pathPattern: "/api/authors",
    permission: "authors:write:own",
  },
  {
    id: "authors-update",
    methods: ["PATCH"],
    pathPattern: "/api/authors/:address",
    permission: "authors:write:own",
  },
  {
    id: "roles-list",
    methods: ["GET"],
    pathPattern: "/api/roles",
    permission: "roles:read",
  },
  {
    id: "roles-create",
    methods: ["POST"],
    pathPattern: "/api/roles",
    permission: "roles:write",
  },
  {
    id: "roles-read",
    methods: ["GET"],
    pathPattern: "/api/roles/:slug",
    permission: "roles:read",
  },
  {
    id: "roles-update",
    methods: ["PATCH"],
    pathPattern: "/api/roles/:slug",
    permission: "roles:write",
  },
  {
    id: "roles-delete",
    methods: ["DELETE"],
    pathPattern: "/api/roles/:slug",
    permission: "roles:delete",
  },
];

export function getRouteById(routeId: string): RouteDefinition | undefined {
  return APP_ROUTES.find((route) => route.id === routeId);
}

export function getRouteByHref(href: string): RouteDefinition | undefined {
  const normalized = normalizeHref(stripLocalePrefix(href));
  return APP_ROUTES.find((route) => normalizeHref(route.href) === normalized);
}

export function normalizeHref(href: string): string {
  if (!href || href === "/") {
    return "/";
  }
  return href.endsWith("/") ? href.slice(0, -1) : href;
}

export function normalizeApiPath(pathname: string): string {
  const withoutQuery = pathname.split("?")[0] ?? pathname;
  if (!withoutQuery || withoutQuery === "/") {
    return "/";
  }
  return withoutQuery.endsWith("/")
    ? withoutQuery.slice(0, -1)
    : withoutQuery;
}

function matchPathPattern(pattern: string, pathname: string): boolean {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return false;
  }

  return patternParts.every((part, index) => {
    if (part.startsWith(":")) {
      return pathParts[index] !== undefined;
    }
    return part === pathParts[index];
  });
}

export function matchApiRoute(
  method: string,
  pathname: string,
): ApiRouteDefinition | undefined {
  const normalizedMethod = method.toUpperCase() as HttpMethod;
  const normalizedPath = normalizeApiPath(pathname);

  return API_ROUTES.find(
    (route) =>
      route.methods.includes(normalizedMethod) &&
      matchPathPattern(route.pathPattern, normalizedPath),
  );
}

export function requiresAuthenticatedUser(
  permission: UserPermission,
): boolean {
  return permission !== "pages:read";
}

export function userFromSnapshot(snapshot: UserSnapshot): PermissionSubject & {
  roleSlug: string;
  address: string;
  status: UserSnapshot["status"];
  preferences: ReturnType<typeof defaultUserPreferences>;
} {
  return {
    address: snapshot.normalizedAddress,
    roleSlug: snapshot.roleSlug,
    status: snapshot.status,
    permissions: snapshot.permissions,
    preferences: {
      ...defaultUserPreferences(),
      declinedAuthorPage: snapshot.declinedAuthorPage,
    },
  };
}

export function canAccessPage(
  user: PermissionSubject | null,
  route: RouteDefinition,
  isConnected: boolean,
): boolean {
  if (!requiresAuthenticatedUser(route.pagePermission)) {
    return true;
  }

  if (!isConnected || !user) {
    return false;
  }

  return hasPermission(user, route.pagePermission);
}

export function canShowRouteInNav(
  route: RouteDefinition,
  context: RouteNavContext,
): boolean {
  if (!canAccessPage(context.user, route, context.isConnected)) {
    return false;
  }

  if (route.showInNav) {
    return route.showInNav(context);
  }

  return true;
}

export function buildAuthorizedNavLinks(
  context: RouteNavContext,
): AuthorizedNavLink[] {
  return APP_ROUTES.filter((route) => canShowRouteInNav(route, context)).map(
    (route) => ({
      href: route.href,
      labelKey: route.labelKey,
    }),
  );
}

export function assertRouteApiAccess(
  user: PermissionSubject,
  method: string,
  pathname: string,
): void {
  const route = matchApiRoute(method, pathname);
  if (!route) {
    return;
  }

  if (!hasPermission(user, route.permission)) {
    throw new RouteAccessDeniedError(route.id, route.permission);
  }
}

export class RouteAccessDeniedError extends Error {
  constructor(
    public readonly routeId: string,
    public readonly permission: UserPermission,
  ) {
    super(`Access denied for route ${routeId} (requires ${permission}).`);
    this.name = "RouteAccessDeniedError";
  }
}
