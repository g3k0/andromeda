import { describe, expect, it } from "vitest";
import { defaultUserPreferences } from "@/lib/users/types";
import type { User } from "@/lib/users/types";
import {
  ADMIN_ROUTE,
  MY_AUTHOR_PAGE_ROUTE,
  RouteAccessDeniedError,
  assertRouteApiAccess,
  buildAuthorizedNavLinks,
  canAccessPage,
  canShowRouteInNav,
  matchApiRoute,
} from "./route-guard";

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

function buildUser(role: User["role"]): User {
  return {
    address: ADDRESS,
    role,
    status: "active",
    permissions: [],
    preferences: defaultUserPreferences(),
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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

  it("allows public read pages without a connected wallet", () => {
    expect(canAccessPage(null, MY_AUTHOR_PAGE_ROUTE, false)).toBe(true);
  });

  it("blocks admin pages for non-admin users", () => {
    const reader = buildUser("reader");
    expect(canAccessPage(reader, ADMIN_ROUTE, true)).toBe(false);
    expect(canAccessPage(buildUser("admin"), ADMIN_ROUTE, true)).toBe(true);
  });

  it("hides admin and author nav links based on role", () => {
    const readerLinks = buildAuthorizedNavLinks({
      user: buildUser("reader"),
      hasAuthorProfile: false,
      isConnected: true,
    });
    expect(readerLinks.map((link) => link.href)).toEqual(["/"]);

    const authorLinks = buildAuthorizedNavLinks({
      user: buildUser("author"),
      hasAuthorProfile: true,
      isConnected: true,
    });
    expect(authorLinks.map((link) => link.href)).toEqual(["/", "/author"]);

    const adminLinks = buildAuthorizedNavLinks({
      user: buildUser("admin"),
      hasAuthorProfile: true,
      isConnected: true,
    });
    expect(adminLinks.map((link) => link.href)).toEqual(["/", "/admin", "/author"]);
  });

  it("requires an author profile before showing La mia pagina", () => {
    expect(
      canShowRouteInNav(MY_AUTHOR_PAGE_ROUTE, {
        user: buildUser("author"),
        hasAuthorProfile: false,
        isConnected: true,
      }),
    ).toBe(false);
  });

  it("asserts API permissions for protected REST endpoints", () => {
    const reader = buildUser("reader");
    const admin = buildUser("admin");

    expect(() =>
      assertRouteApiAccess(reader, "GET", "/api/users"),
    ).toThrow(RouteAccessDeniedError);

    expect(() =>
      assertRouteApiAccess(admin, "GET", "/api/users"),
    ).not.toThrow();
  });
});
