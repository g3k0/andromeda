/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "./I18nProvider";
import { LocalizedLink } from "./LocalizedLink";

import type { SupportedLocale } from "./locales";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

function renderLink(locale: SupportedLocale, href: string) {
  return render(
    <I18nProvider locale={locale}>
      <LocalizedLink href={href}>Go</LocalizedLink>
    </I18nProvider>,
  );
}

describe("LocalizedLink", () => {
  afterEach(() => {
    cleanup();
  });

  it("prefixes logical paths with the active locale", () => {
    renderLink("it", "/works");
    expect(screen.getByRole("link", { name: "Go" })).toHaveAttribute(
      "href",
      "/it/works",
    );
  });

  it("localizes the home path", () => {
    renderLink("fr", "/");
    expect(screen.getByRole("link", { name: "Go" })).toHaveAttribute(
      "href",
      "/fr",
    );
  });
});
