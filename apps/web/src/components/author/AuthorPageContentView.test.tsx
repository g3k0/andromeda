/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthorProfile } from "@/lib/authors/types";
import { AuthorPageContentView } from "./AuthorPageContentView";

vi.mock("./AuthorProfileEditor", () => ({
  AuthorProfileEditor: ({
    isAdminEditingOther,
    profile,
  }: {
    isAdminEditingOther: boolean;
    profile: AuthorProfile;
  }) => (
    <div data-testid="author-editor">
      {isAdminEditingOther ? <span>Editing as administrator</span> : null}
      <span>{profile.displayName}</span>
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

  it("renders read-only view when editing is not allowed", () => {
    render(
      <AuthorPageContentView
        profile={profile}
        canEdit={false}
        isAdminEditingOther={false}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByRole("article")).toBeInTheDocument();
    expect(screen.queryByTestId("author-editor")).not.toBeInTheDocument();
  });

  it("renders the editor when editing is allowed", () => {
    render(
      <AuthorPageContentView
        profile={profile}
        canEdit
        isAdminEditingOther={false}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByTestId("author-editor")).toBeInTheDocument();
  });

  it("passes the admin label flag to the editor", () => {
    render(
      <AuthorPageContentView
        profile={profile}
        canEdit
        isAdminEditingOther
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText("Editing as administrator")).toBeInTheDocument();
  });
});
