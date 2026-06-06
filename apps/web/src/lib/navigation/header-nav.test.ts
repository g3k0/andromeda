import { describe, expect, it } from "vitest";
import {
  ADMIN_NAV_LINK,
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

  it("includes Admin only for admins", () => {
    expect(buildHeaderNavLinks({ role: "admin", hasAuthorProfile: false })).toEqual(
      [LIBRARY_NAV_LINK, ADMIN_NAV_LINK],
    );
    expect(buildHeaderNavLinks({ role: "author", hasAuthorProfile: true })).toEqual(
      [LIBRARY_NAV_LINK, MY_AUTHOR_PAGE_NAV_LINK],
    );
  });

  it("omits La mia pagina for readers who declined onboarding", () => {
    expect(buildHeaderNavLinks({ role: "reader", hasAuthorProfile: false })).not.toContainEqual(
      MY_AUTHOR_PAGE_NAV_LINK,
    );
  });

  it("includes La mia pagina for authors and admins with a profile", () => {
    expect(buildHeaderNavLinks({ role: "author", hasAuthorProfile: true })).toContainEqual(
      MY_AUTHOR_PAGE_NAV_LINK,
    );
    expect(buildHeaderNavLinks({ role: "admin", hasAuthorProfile: true })).toEqual([
      LIBRARY_NAV_LINK,
      ADMIN_NAV_LINK,
      MY_AUTHOR_PAGE_NAV_LINK,
    ]);
  });
});
