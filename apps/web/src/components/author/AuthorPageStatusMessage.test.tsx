/** @vitest-environment jsdom */

import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "@/lib/i18n/test-utils";
import {
  AuthorPageInvalidAddress,
  AuthorPageNotFound,
  AuthorPageStatusMessage,
} from "./AuthorPageStatusMessage";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("AuthorPageStatusMessage", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders title, description, and library link", () => {
    renderWithI18n(
      <AuthorPageStatusMessage
        title="Test title"
        description="Test description"
      />,
    );

    expect(screen.getByRole("heading", { name: "Test title" })).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Library" })).toHaveAttribute(
      "href",
      "/en",
    );
  });
});

describe("AuthorPageInvalidAddress", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows an invalid address message", () => {
    renderWithI18n(<AuthorPageInvalidAddress />);
    expect(screen.getByRole("heading", { name: "Invalid wallet address" })).toBeInTheDocument();
  });
});

describe("AuthorPageNotFound", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows not found copy and the normalized address", () => {
    const address = "0xabcdef0123456789abcdef0123456789abcdef01";
    renderWithI18n(<AuthorPageNotFound address={address} />);

    expect(screen.getByRole("heading", { name: "Author page not found" })).toBeInTheDocument();
    expect(screen.getByText(address)).toBeInTheDocument();
  });
});
