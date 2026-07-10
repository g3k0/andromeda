import { describe, expect, it } from "vitest";
import { translate } from "@/lib/i18n/translate";
import {
  ABOUT_NAV_LINK,
  CATALOG_NAV_LINK,
  LIBRARY_NAV_LINK,
  MY_AUTHOR_PAGE_NAV_LINK,
  buildHeaderNavLinks,
  shouldShowMyAuthorPageLink,
} from "./header-nav";

const LOCALE = "en" as const;

const LOCALIZED_CATALOG = {
  href: "/en/works",
  label: translate(LOCALE, CATALOG_NAV_LINK.labelKey),
};
const LOCALIZED_LIBRARY = {
  href: "/en/library",
  label: translate(LOCALE, LIBRARY_NAV_LINK.labelKey),
};
const LOCALIZED_ABOUT = {
  href: "/en/about",
  label: translate(LOCALE, ABOUT_NAV_LINK.labelKey),
};
const LOCALIZED_MY_PAGE = {
  href: "/en/author",
  label: translate(LOCALE, MY_AUTHOR_PAGE_NAV_LINK.labelKey),
};

describe("shouldShowMyAuthorPageLink", () => {
  it("returns true for authors", () => {
    expect(
      shouldShowMyAuthorPageLink({ role: "author", hasAuthorProfile: true }, LOCALE),
    ).toBe(true);
  });

  it("returns true for admins with a profile", () => {
    expect(
      shouldShowMyAuthorPageLink({ role: "admin", hasAuthorProfile: true }, LOCALE),
    ).toBe(true);
  });

  it("returns false for admins without a profile", () => {
    expect(
      shouldShowMyAuthorPageLink({ role: "admin", hasAuthorProfile: false }, LOCALE),
    ).toBe(false);
  });

  it("returns false for readers including those who declined", () => {
    expect(
      shouldShowMyAuthorPageLink({ role: "reader", hasAuthorProfile: false }, LOCALE),
    ).toBe(false);
  });
});

describe("buildHeaderNavLinks", () => {
  it("always includes Catalog, Library and About with locale prefixes", () => {
    expect(buildHeaderNavLinks({ role: "reader", hasAuthorProfile: false }, LOCALE)).toEqual(
      [LOCALIZED_CATALOG, LOCALIZED_LIBRARY, LOCALIZED_ABOUT],
    );
  });

  it("localizes links and labels for Italian visitors", () => {
    expect(buildHeaderNavLinks({ role: "reader", hasAuthorProfile: false }, "it")).toEqual([
      { href: "/it/works", label: translate("it", "nav.catalog") },
      { href: "/it/library", label: translate("it", "nav.library") },
      { href: "/it/about", label: translate("it", "nav.about") },
    ]);
  });

  it("localizes links and labels for German visitors", () => {
    expect(buildHeaderNavLinks({ role: "reader", hasAuthorProfile: false }, "de")).toEqual([
      { href: "/de/works", label: translate("de", "nav.catalog") },
      { href: "/de/library", label: translate("de", "nav.library") },
      { href: "/de/about", label: translate("de", "nav.about") },
    ]);
  });

  it("does not include Admin in the header nav for any role", () => {
    expect(buildHeaderNavLinks({ role: "admin", hasAuthorProfile: false }, LOCALE)).toEqual(
      [LOCALIZED_CATALOG, LOCALIZED_LIBRARY, LOCALIZED_ABOUT],
    );
    expect(buildHeaderNavLinks({ role: "author", hasAuthorProfile: true }, LOCALE)).toEqual(
      [LOCALIZED_CATALOG, LOCALIZED_LIBRARY, LOCALIZED_ABOUT, LOCALIZED_MY_PAGE],
    );
  });

  it("omits My page for readers who declined onboarding", () => {
    expect(buildHeaderNavLinks({ role: "reader", hasAuthorProfile: false }, LOCALE)).not.toContainEqual(
      LOCALIZED_MY_PAGE,
    );
  });

  it("includes My page for authors and admins with a profile", () => {
    expect(buildHeaderNavLinks({ role: "author", hasAuthorProfile: true }, LOCALE)).toContainEqual(
      LOCALIZED_MY_PAGE,
    );
    expect(buildHeaderNavLinks({ role: "admin", hasAuthorProfile: true }, LOCALE)).toEqual([
      LOCALIZED_CATALOG,
      LOCALIZED_LIBRARY,
      LOCALIZED_ABOUT,
      LOCALIZED_MY_PAGE,
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
    }, LOCALE);

    expect(links).toEqual([LOCALIZED_CATALOG, LOCALIZED_LIBRARY, LOCALIZED_ABOUT]);
  });
});
