/** @vitest-environment jsdom */

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { AdminManageTabs } from "./AdminManageTabs";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/admin/users",
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
});
