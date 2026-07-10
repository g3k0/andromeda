/** @vitest-environment jsdom */

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { AdminManageTabs } from "./AdminManageTabs";

const navigationState = vi.hoisted(() => ({
  pathname: "/en/admin/users",
  locale: "en",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
  useParams: () => ({ locale: navigationState.locale }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("AdminManageTabs", () => {
  afterEach(() => {
    cleanup();
    navigationState.pathname = "/en/admin/users";
    navigationState.locale = "en";
  });

  it("renders management tabs with active users link", () => {
    render(
      <I18nProvider locale="en">
        <AdminManageTabs />
      </I18nProvider>,
    );

    expect(screen.getByText("Manage users and roles")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Roles" })).toHaveAttribute(
      "href",
      "/en/admin/roles",
    );
  });

  it("renders Italian tab labels when locale is it", () => {
    navigationState.pathname = "/it/admin/users";
    navigationState.locale = "it";

    render(
      <I18nProvider locale="it">
        <AdminManageTabs />
      </I18nProvider>,
    );

    expect(screen.getByRole("link", { name: "Utenti" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ruoli" })).toHaveAttribute(
      "href",
      "/it/admin/roles",
    );
  });
});
