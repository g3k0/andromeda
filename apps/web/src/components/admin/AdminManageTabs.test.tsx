/** @vitest-environment jsdom */

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminManageTabs } from "./AdminManageTabs";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/users",
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
    render(<AdminManageTabs />);

    expect(screen.getByText("Manage users and roles")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Roles" })).toHaveAttribute(
      "href",
      "/admin/roles",
    );
  });
});
