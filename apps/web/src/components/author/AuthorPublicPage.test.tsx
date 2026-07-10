/** @vitest-environment jsdom */

import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "@/lib/i18n/test-utils";
import type { AuthorProfile } from "@/lib/authors/types";
import { AuthorProfileView } from "./AuthorProfileView";
import { AuthorPublicPage } from "./AuthorPublicPage";

vi.mock("./AuthorPageClient", () => ({
  AuthorPageClient: ({ profile }: { profile: AuthorProfile }) => (
    <AuthorProfileView profile={profile} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

const profile: AuthorProfile = {
  address: ADDRESS,
  displayName: "Jane Doe",
  avatarUrl: null,
  bio: null,
  createdAt: "2026-06-03T12:00:00.000Z",
};

describe("AuthorPublicPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders AuthorProfileView when profile is ready", () => {
    renderWithI18n(<AuthorPublicPage state={{ status: "ready", profile }} />);

    expect(screen.getByRole("heading", { name: "Jane Doe" })).toBeInTheDocument();
    expect(screen.getByText(ADDRESS)).toBeInTheDocument();
  });

  it("renders invalid address UI", () => {
    renderWithI18n(<AuthorPublicPage state={{ status: "invalid_address" }} />);

    expect(screen.getByRole("heading", { name: "Invalid wallet address" })).toBeInTheDocument();
  });

  it("renders not found UI with address", () => {
    renderWithI18n(
      <AuthorPublicPage state={{ status: "not_found", address: ADDRESS }} />,
    );

    expect(screen.getByRole("heading", { name: "Author page not found" })).toBeInTheDocument();
    expect(screen.getAllByText(ADDRESS).length).toBeGreaterThan(0);
  });
});
