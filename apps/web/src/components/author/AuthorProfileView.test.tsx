/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthorProfile } from "@/lib/authors/types";
import { AUTHOR_AVATAR_PLACEHOLDER_PATH } from "./constants";
import { AuthorProfileView } from "./AuthorProfileView";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const ADDRESS = "0xabcdef0123456789abcdef0123456789abcdef01";

function buildProfile(overrides: Partial<AuthorProfile> = {}): AuthorProfile {
  return {
    address: ADDRESS,
    displayName: "Jane Doe",
    avatarUrl: null,
    createdAt: "2026-06-03T12:00:00.000Z",
    ...overrides,
  };
}

describe("AuthorProfileView", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the author display name as the page heading", () => {
    render(<AuthorProfileView profile={buildProfile()} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Jane Doe" }),
    ).toBeInTheDocument();
  });

  it("renders the full blockchain address below the name", () => {
    render(<AuthorProfileView profile={buildProfile()} />);

    const address = screen.getByText(ADDRESS);
    expect(address.tagName).toBe("P");
    expect(address).toHaveClass("font-mono", "break-all", "text-white/60");
  });

  it("renders the placeholder avatar when avatarUrl is null", () => {
    render(<AuthorProfileView profile={buildProfile()} />);

    expect(screen.getByRole("img", { name: "Jane Doe" })).toHaveAttribute(
      "src",
      AUTHOR_AVATAR_PLACEHOLDER_PATH,
    );
  });

  it("renders a custom avatar when avatarUrl is set", () => {
    render(
      <AuthorProfileView
        profile={buildProfile({ avatarUrl: "ipfs://author-avatar" })}
      />,
    );

    expect(screen.getByRole("img", { name: "Jane Doe" })).toHaveAttribute(
      "src",
      "https://ipfs.io/ipfs/author-avatar",
    );
  });

  it("exposes the profile as an article landmark", () => {
    render(<AuthorProfileView profile={buildProfile()} />);
    expect(screen.getByRole("article")).toBeInTheDocument();
  });

  it("shows the public address label", () => {
    render(<AuthorProfileView profile={buildProfile()} />);
    expect(screen.getByText("Public address")).toBeInTheDocument();
  });

  it("shows edit and publish actions for the profile owner", () => {
    const onEditClick = vi.fn();

    render(
      <AuthorProfileView
        profile={buildProfile()}
        showEditButton
        onEditClick={onEditClick}
        showPublishWorkLink
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(onEditClick).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Publish work" })).toHaveAttribute(
      "href",
      `/author/${ADDRESS}/publish`,
    );
  });
});
