/** @vitest-environment jsdom */

import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "@/lib/i18n/test-utils";
import { CreateAuthorPrompt } from "./CreateAuthorPrompt";

describe("CreateAuthorPrompt", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders nothing when closed", () => {
    const { container } = renderWithI18n(
      <CreateAuthorPrompt
        open={false}
        onAccept={vi.fn()}
        onDecline={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the dialog copy when open", () => {
    renderWithI18n(
      <CreateAuthorPrompt
        open
        onAccept={vi.fn()}
        onDecline={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Do you want to create your author page?" }),
    ).toBeInTheDocument();
  });

  it("calls accept, decline, and cancel handlers", async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    const onDecline = vi.fn();
    const onCancel = vi.fn();

    renderWithI18n(
      <CreateAuthorPrompt
        open
        onAccept={onAccept}
        onDecline={onDecline}
        onCancel={onCancel}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Yes, create page" }),
    );
    await user.click(
      screen.getByRole("button", { name: "No, stay as reader" }),
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onAccept).toHaveBeenCalledOnce();
    expect(onDecline).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("disables actions and shows a spinner while loading", () => {
    renderWithI18n(
      <CreateAuthorPrompt
        open
        loading
        onAccept={vi.fn()}
        onDecline={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("status", { name: "Creating author page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Yes, create page/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "No, stay as reader" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });
});
