/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CreateAuthorPrompt } from "./CreateAuthorPrompt";

describe("CreateAuthorPrompt", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <CreateAuthorPrompt open={false} onAccept={vi.fn()} onDecline={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the dialog with Italian copy when open", () => {
    render(
      <CreateAuthorPrompt open onAccept={vi.fn()} onDecline={vi.fn()} />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Vuoi creare la tua pagina autore?" }),
    ).toBeInTheDocument();
  });

  it("calls accept and decline handlers", async () => {
    const user = userEvent.setup();
    const onAccept = vi.fn();
    const onDecline = vi.fn();

    render(
      <CreateAuthorPrompt open onAccept={onAccept} onDecline={onDecline} />,
    );

    await user.click(
      screen.getByRole("button", { name: "Sì, crea la pagina" }),
    );
    await user.click(
      screen.getByRole("button", { name: "No, resto lettore" }),
    );

    expect(onAccept).toHaveBeenCalledOnce();
    expect(onDecline).toHaveBeenCalledOnce();
  });

  it("disables actions and shows a spinner while loading", () => {
    render(
      <CreateAuthorPrompt
        open
        loading
        onAccept={vi.fn()}
        onDecline={vi.fn()}
      />,
    );

    expect(screen.getByRole("status", { name: "Creating author page" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sì, crea la pagina/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "No, resto lettore" })).toBeDisabled();
  });
});
