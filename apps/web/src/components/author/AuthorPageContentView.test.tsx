/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthorProfile } from "@/lib/authors/types";
import { AuthorPageContentView } from "./AuthorPageContentView";

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

vi.mock("./AuthorProfileEditor", () => ({
  AuthorProfileEditor: ({
    isAdminEditingOther,
    profile,
    onCancel,
    onSave,
  }: {
    isAdminEditingOther: boolean;
    profile: AuthorProfile;
    onCancel: () => void;
    onSave: (input: {
      displayName: string;
      avatarUrl: string | null;
    }) => Promise<void>;
  }) => (
    <div data-testid="author-editor">
      {isAdminEditingOther ? <span>Editing as administrator</span> : null}
      <span>{profile.displayName}</span>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
      <button
        type="button"
        onClick={() =>
          void onSave({ displayName: profile.displayName, avatarUrl: null })
        }
      >
        Save
      </button>
    </div>
  ),
}));

const profile: AuthorProfile = {
  address: "0xabcdef0123456789abcdef0123456789abcdef01",
  displayName: "Jane Doe",
  avatarUrl: null,
  createdAt: "2026-06-03T12:00:00.000Z",
};

describe("AuthorPageContentView", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders read-only view for visitors", () => {
    render(
      <AuthorPageContentView
        profile={profile}
        viewState={{ variant: "read-only", audience: "visitor" }}
        onEditClick={vi.fn()}
      />,
    );

    expect(screen.getByRole("article")).toBeInTheDocument();
    expect(screen.queryByTestId("author-editor")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Publish work" }),
    ).not.toBeInTheDocument();
  });

  it("renders read-only view with edit and publish for the profile owner", () => {
    render(
      <AuthorPageContentView
        profile={profile}
        viewState={{ variant: "read-only", audience: "owner" }}
        onEditClick={vi.fn()}
      />,
    );

    expect(screen.getByRole("article")).toBeInTheDocument();
    expect(screen.queryByTestId("author-editor")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Publish work" })).toHaveAttribute(
      "href",
      `/author/${profile.address}/publish`,
    );
  });

  it("calls onEditClick when the owner clicks Edit", () => {
    const onEditClick = vi.fn();

    render(
      <AuthorPageContentView
        profile={profile}
        viewState={{ variant: "read-only", audience: "owner" }}
        onEditClick={onEditClick}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(onEditClick).toHaveBeenCalled();
  });

  it("renders the owner editor without publish work", () => {
    render(
      <AuthorPageContentView
        profile={profile}
        viewState={{ variant: "edit", audience: "owner" }}
        onCancelEdit={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByTestId("author-editor")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Publish work" }),
    ).not.toBeInTheDocument();
  });

  it("renders the admin editor variant", () => {
    render(
      <AuthorPageContentView
        profile={profile}
        viewState={{ variant: "edit", audience: "admin" }}
        onCancelEdit={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByTestId("author-editor")).toBeInTheDocument();
    expect(screen.getByText("Editing as administrator")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
  });

  it("calls onCancelEdit when cancel is clicked", () => {
    const onCancelEdit = vi.fn();

    render(
      <AuthorPageContentView
        profile={profile}
        viewState={{ variant: "edit", audience: "owner" }}
        onCancelEdit={onCancelEdit}
        onSave={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancelEdit).toHaveBeenCalled();
  });

  it("forwards save to the editor", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <AuthorPageContentView
        profile={profile}
        viewState={{ variant: "edit", audience: "owner" }}
        onCancelEdit={vi.fn()}
        onSave={onSave}
      />,
    );

    await fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalled();
  });
});
