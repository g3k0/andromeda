/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthorProfile } from "@/lib/authors/types";
import type { AuthorPageResolved } from "@/lib/authors/author-page";
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
  createdAt: "2026-06-03T12:00:00.000Z",
};

function mockResolve(state: AuthorPageResolved) {
  return vi.fn().mockReturnValue(state);
}

describe("AuthorPublicPage", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders AuthorProfileView when profile is ready", () => {
    render(
      <AuthorPublicPage
        addressParam={ADDRESS}
        resolvePage={mockResolve({ status: "ready", profile })}
      />,
    );

    expect(screen.getByRole("heading", { name: "Jane Doe" })).toBeInTheDocument();
    expect(screen.getByText(ADDRESS)).toBeInTheDocument();
  });

  it("renders invalid address UI", () => {
    render(
      <AuthorPublicPage
        addressParam="bad"
        resolvePage={mockResolve({ status: "invalid_address" })}
      />,
    );

    expect(screen.getByRole("heading", { name: "Invalid wallet address" })).toBeInTheDocument();
  });

  it("renders not found UI with address", () => {
    render(
      <AuthorPublicPage
        addressParam={ADDRESS}
        resolvePage={mockResolve({ status: "not_found", address: ADDRESS })}
      />,
    );

    expect(screen.getByRole("heading", { name: "Author page not found" })).toBeInTheDocument();
    expect(screen.getAllByText(ADDRESS).length).toBeGreaterThan(0);
  });

  it("passes a custom lookup to resolvePage", () => {
    const lookup = vi.fn().mockReturnValue(profile);
    const resolvePage = vi.fn().mockReturnValue({
      status: "ready",
      profile,
    } as const);

    render(
      <AuthorPublicPage
        addressParam={ADDRESS}
        lookup={lookup}
        resolvePage={resolvePage}
      />,
    );

    expect(resolvePage).toHaveBeenCalledWith(ADDRESS, lookup);
  });
});
