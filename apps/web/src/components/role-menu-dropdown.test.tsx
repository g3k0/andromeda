/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

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

describe("RoleMenuDropdown", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders a role-specific dropdown trigger", async () => {
    const user = userEvent.setup();
    render(<RoleMenuDropdown role="author" onLogout={vi.fn()} />);

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

    const { unmount } = render(
      <RoleMenuDropdown role="reader" onLogout={vi.fn()} />,
    );
    await user.click(screen.getByText("Reader"));
    expect(
      screen.getByRole("menuitem", { name: "Become author" }),
    ).toBeInTheDocument();
    unmount();

    render(<RoleMenuDropdown role="author" onLogout={vi.fn()} />);
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
        <RoleMenuDropdown role="author" onLogout={vi.fn()} />
      </div>,
    );

    const menu = screen.getByRole("group");

    await user.click(screen.getByText("Author"));
    expect(menu).toHaveAttribute("open");

    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(menu).not.toHaveAttribute("open");
  });

  it("shows manage-users link for admins", async () => {
    const user = userEvent.setup();
    render(<RoleMenuDropdown role="admin" onLogout={vi.fn()} />);

    await user.click(screen.getByText("Admin"));

    expect(
      screen.getByRole("menuitem", { name: "Manage users" }),
    ).toHaveAttribute("href", "/admin/users");
  });

  it("calls onLogout when the user selects logout", async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();

    render(<RoleMenuDropdown role="admin" onLogout={onLogout} />);

    await user.click(screen.getByText("Admin"));
    await user.click(screen.getByRole("menuitem", { name: "Logout" }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
