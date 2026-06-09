import { describe, expect, it } from "vitest";
import {
  LIBRARY_NAV_LINK,
  MY_AUTHOR_PAGE_NAV_LINK,
  buildHeaderNavLinks,
  shouldShowMyAuthorPageLink,
} from "./header-nav";

describe("shouldShowMyAuthorPageLink", () => {
  it("returns true for authors", () => {
    expect(
      shouldShowMyAuthorPageLink({ role: "author", hasAuthorProfile: true }),
    ).toBe(true);
  });

  it("returns true for admins with a profile", () => {
    expect(
      shouldShowMyAuthorPageLink({ role: "admin", hasAuthorProfile: true }),
    ).toBe(true);
  });

  it("returns false for admins without a profile", () => {
    expect(
      shouldShowMyAuthorPageLink({ role: "admin", hasAuthorProfile: false }),
    ).toBe(false);
  });

  it("returns false for readers including those who declined", () => {
    expect(
      shouldShowMyAuthorPageLink({ role: "reader", hasAuthorProfile: false }),
    ).toBe(false);
  });
});

describe("buildHeaderNavLinks", () => {
  it("always includes Library", () => {
    expect(buildHeaderNavLinks({ role: "reader", hasAuthorProfile: false })).toEqual(
      [LIBRARY_NAV_LINK],
    );
  });

  it("does not include Admin in the header nav for any role", () => {
    expect(buildHeaderNavLinks({ role: "admin", hasAuthorProfile: false })).toEqual(
      [LIBRARY_NAV_LINK],
    );
    expect(buildHeaderNavLinks({ role: "author", hasAuthorProfile: true })).toEqual(
      [LIBRARY_NAV_LINK, MY_AUTHOR_PAGE_NAV_LINK],
    );
  });

  it("omits My page for readers who declined onboarding", () => {
    expect(buildHeaderNavLinks({ role: "reader", hasAuthorProfile: false })).not.toContainEqual(
      MY_AUTHOR_PAGE_NAV_LINK,
    );
  });

  it("includes My page for authors and admins with a profile", () => {
    expect(buildHeaderNavLinks({ role: "author", hasAuthorProfile: true })).toContainEqual(
      MY_AUTHOR_PAGE_NAV_LINK,
    );
    expect(buildHeaderNavLinks({ role: "admin", hasAuthorProfile: true })).toEqual([
      LIBRARY_NAV_LINK,
      MY_AUTHOR_PAGE_NAV_LINK,
    ]);
  });

  it("uses snapshot permissions instead of static role defaults", () => {
    const links = buildHeaderNavLinks({
      role: "reader",
      hasAuthorProfile: true,
      snapshot: {
        normalizedAddress: "0xabcdef0123456789abcdef0123456789abcdef01",
        isConnected: true,
        roleSlug: "reader",
        roleName: "Reader",
        status: "active",
        permissions: ["pages:read"],
        hasAuthorProfile: true,
        declinedAuthorPage: false,
      },
    });

    expect(links).toEqual([LIBRARY_NAV_LINK]);
  });
});
