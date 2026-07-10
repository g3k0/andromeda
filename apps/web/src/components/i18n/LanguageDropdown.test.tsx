/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LanguageDropdown } from "./LanguageDropdown";

const mockedUseRouter = vi.mocked(useRouter);

describe("LanguageDropdown", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the active locale with flag and label", () => {
    render(<LanguageDropdown />);

    const trigger = screen.getByRole("group");
    expect(trigger).toHaveTextContent("English");
    expect(trigger).toHaveTextContent("🇬🇧");
  });

  it("navigates to the same path in the selected locale", async () => {
    const push = vi.fn();
    mockedUseRouter.mockReturnValue({
      push,
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    });

    vi.stubGlobal("location", {
      ...window.location,
      pathname: "/en/works",
    });

    const user = userEvent.setup();
    render(<LanguageDropdown />);

    await user.click(screen.getByRole("group"));
    await user.click(screen.getByRole("menuitem", { name: /Italiano/i }));

    expect(push).toHaveBeenCalledWith("/it/works");
  });
});
