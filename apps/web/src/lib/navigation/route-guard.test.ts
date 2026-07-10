import { describe, expect, it } from "vitest";
import { buildAuthenticatedUser } from "@/lib/users/testing/build-authenticated-user";
import {
  ABOUT_ROUTE,
  ADMIN_ROUTE,
  MY_AUTHOR_PAGE_ROUTE,
  RouteAccessDeniedError,
  assertRouteApiAccess,
  buildAuthorizedNavLinks,
  canAccessPage,
  canShowRouteInNav,
  getRouteByHref,
  matchApiRoute,
  userFromSnapshot,
} from "./route-guard";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

function buildNavUser(roleSlug: string) {
  const user = buildAuthenticatedUser(ADDRESS, roleSlug);
  return {
    roleSlug: user.roleSlug,
    permissions: user.permissions,
  };
}

describe("route guard", () => {
  it("matches API routes by method and path", () => {
    expect(matchApiRoute("GET", "/api/users")).toMatchObject({
      id: "users-list",
    });
    expect(matchApiRoute("PATCH", "/api/authors/0xabc")).toMatchObject({
      id: "authors-update",
    });
    expect(matchApiRoute("GET", "/api/authors/0xabc")).toBeUndefined();
  });

  it("resolves routes from locale-prefixed hrefs", () => {
    expect(getRouteByHref("/it/works")).toBeDefined();
    expect(getRouteByHref("/it/works")?.id).toBe("catalog");
    expect(getRouteByHref("/en/library")?.id).toBe("library");
  });

  it("allows public read pages without a connected wallet", () => {
    expect(canAccessPage(null, MY_AUTHOR_PAGE_ROUTE, false)).toBe(true);
    expect(canAccessPage(null, ABOUT_ROUTE, false)).toBe(true);
  });

  it("maps snapshot permissions for route checks", () => {
    const user = userFromSnapshot({
      normalizedAddress: ADDRESS,
      isConnected: true,
      roleSlug: "ops",
      roleName: "Ops",
      status: "active",
      permissions: ["pages:read", "admin:access"],
      hasAuthorProfile: false,
      declinedAuthorPage: false,
    });

    expect(canAccessPage(user, ADMIN_ROUTE, true)).toBe(true);
  });

  it("blocks admin pages for non-admin users", () => {
    const reader = buildNavUser("reader");
    expect(canAccessPage(reader, ADMIN_ROUTE, true)).toBe(false);
    expect(canAccessPage(buildNavUser("admin"), ADMIN_ROUTE, true)).toBe(true);
  });

  it("hides admin and author nav links based on role", () => {
    const readerLinks = buildAuthorizedNavLinks({
      user: buildNavUser("reader"),
      hasAuthorProfile: false,
      isConnected: true,
    });
    expect(readerLinks.map((link) => link.href)).toEqual([
      "/works",
      "/library",
      "/about",
    ]);

    const authorLinks = buildAuthorizedNavLinks({
      user: buildNavUser("author"),
      hasAuthorProfile: true,
      isConnected: true,
    });
    expect(authorLinks.map((link) => link.href)).toEqual([
      "/works",
      "/library",
      "/about",
      "/author",
    ]);

    const adminLinks = buildAuthorizedNavLinks({
      user: buildNavUser("admin"),
      hasAuthorProfile: true,
      isConnected: true,
    });
    expect(adminLinks.map((link) => link.href)).toEqual([
      "/works",
      "/library",
      "/about",
      "/author",
    ]);
  });

  it("requires an author profile before showing My page", () => {
    expect(
      canShowRouteInNav(MY_AUTHOR_PAGE_ROUTE, {
        user: buildNavUser("author"),
        hasAuthorProfile: false,
        isConnected: true,
      }),
    ).toBe(false);
  });

  it("asserts API permissions for protected REST endpoints", () => {
    const reader = buildNavUser("reader");
    const admin = buildNavUser("admin");

    expect(() =>
      assertRouteApiAccess(reader, "GET", "/api/users"),
    ).toThrow(RouteAccessDeniedError);

    expect(() =>
      assertRouteApiAccess(admin, "GET", "/api/users"),
    ).not.toThrow();
  });
});
