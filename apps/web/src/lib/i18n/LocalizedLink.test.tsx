/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { useParams } from "next/navigation";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocalizedLink } from "./LocalizedLink";
import type { SupportedLocale } from "./locales";

const mockedUseParams = vi.mocked(useParams);

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
  mockedUseParams.mockReturnValue({ locale });
  return render(<LocalizedLink href={href}>Go</LocalizedLink>);
}

describe("LocalizedLink", () => {
  afterEach(() => {
    cleanup();
    mockedUseParams.mockReturnValue({ locale: "en" });
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
