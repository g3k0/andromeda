/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
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

    expect(screen.getByRole("menuitem", { name: "item-1" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "item-2" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Logout" })).toBeInTheDocument();
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
