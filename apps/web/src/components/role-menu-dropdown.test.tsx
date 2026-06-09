/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultPermissionsForRoleSlug } from "@/lib/users/default-role-permissions";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { RoleMenuDropdown } from "./RoleMenuDropdown";

function renderMenu(roleSlug: "admin" | "author" | "reader") {
  const labels = {
    admin: "Admin",
    author: "Author",
    reader: "Reader",
  } as const;

  return render(
    <RoleMenuDropdown
      roleSlug={roleSlug}
      roleName={labels[roleSlug]}
      permissions={defaultPermissionsForRoleSlug(roleSlug)}
      onLogout={vi.fn()}
    />,
  );
}

describe("RoleMenuDropdown", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders a role-specific dropdown trigger", async () => {
    const user = userEvent.setup();
    renderMenu("author");

    await user.click(screen.getByText("Author"));

    expect(
      screen.getByRole("menuitem", { name: "Profile settings" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Change language" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Logout" })).toBeInTheDocument();
  });

  it("shows become-author only for readers", async () => {
    const user = userEvent.setup();

    const { unmount } = renderMenu("reader");
    await user.click(screen.getByText("Reader"));
    expect(
      screen.getByRole("menuitem", { name: "Become author" }),
    ).toBeInTheDocument();
    unmount();

    renderMenu("author");
    await user.click(screen.getByText("Author"));
    expect(
      screen.queryByRole("menuitem", { name: "Become author" }),
    ).not.toBeInTheDocument();
  });

  it("closes when clicking outside the dropdown", async () => {
    const user = userEvent.setup();

    render(
      <div>
        <button type="button">Outside</button>
        <RoleMenuDropdown
          roleSlug="author"
          roleName="Author"
          permissions={defaultPermissionsForRoleSlug("author")}
          onLogout={vi.fn()}
        />
      </div>,
    );

    const menu = screen.getByRole("group");

    await user.click(screen.getByText("Author"));
    expect(menu).toHaveAttribute("open");

    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(menu).not.toHaveAttribute("open");
  });

  it("shows manage-users link when snapshot permissions include admin access", async () => {
    const user = userEvent.setup();
    renderMenu("admin");

    await user.click(screen.getByText("Admin"));

    expect(
      screen.getByRole("menuitem", { name: "Manage users and roles" }),
    ).toHaveAttribute("href", "/admin/users");
  });

  it("calls onLogout when the user selects logout", async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();

    render(
      <RoleMenuDropdown
        roleSlug="admin"
        roleName="Admin"
        permissions={defaultPermissionsForRoleSlug("admin")}
        onLogout={onLogout}
      />,
    );

    await user.click(screen.getByText("Admin"));
    await user.click(screen.getByRole("menuitem", { name: "Logout" }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
