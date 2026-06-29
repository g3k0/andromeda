/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthorProfile } from "@/lib/authors/types";
import { createEditorFormState } from "./author-profile-editor-state";
import { AuthorProfileEditorView } from "./AuthorProfileEditorView";

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

const profile: AuthorProfile = {
  address: "0xabcdef0123456789abcdef0123456789abcdef01",
  displayName: "Jane Doe",
  avatarUrl: null,
  createdAt: "2026-06-03T12:00:00.000Z",
};

describe("AuthorProfileEditorView", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the administrator label when editing as admin", () => {
    render(
      <AuthorProfileEditorView
        profile={profile}
        form={createEditorFormState(profile)}
        isAdminEditingOther
        onDisplayNameChange={vi.fn()}
        onAvatarFileSelect={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("Editing as administrator")).toBeInTheDocument();
  });

  it("calls save handlers on submit", () => {
    const onSubmit = vi.fn();

    render(
      <AuthorProfileEditorView
        profile={profile}
        form={createEditorFormState(profile)}
        isAdminEditingOther={false}
        onDisplayNameChange={vi.fn()}
        onAvatarFileSelect={vi.fn()}
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.submit(screen.getByRole("button", { name: "Save" }).closest("form")!);
    expect(onSubmit).toHaveBeenCalled();
  });

  it("shows field validation errors from form state", () => {
    render(
      <AuthorProfileEditorView
        profile={profile}
        form={{
          ...createEditorFormState(profile),
          displayNameError: "Display name contains invalid characters.",
          avatarError: "Allowed formats: PNG, JPEG, WebP.",
        }}
        isAdminEditingOther={false}
        onDisplayNameChange={vi.fn()}
        onAvatarFileSelect={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Display name contains invalid characters."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Allowed formats: PNG, JPEG, WebP."),
    ).toBeInTheDocument();
  });

  it("shows submit errors from form state", () => {
    render(
      <AuthorProfileEditorView
        profile={profile}
        form={{
          ...createEditorFormState(profile),
          errorMessage: "Display name is required.",
        }}
        isAdminEditingOther={false}
        onDisplayNameChange={vi.fn()}
        onAvatarFileSelect={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Display name is required.",
    );
  });

  it("renders the author name field directly below the profile image", () => {
    render(
      <AuthorProfileEditorView
        profile={profile}
        form={createEditorFormState(profile)}
        isAdminEditingOther={false}
        onDisplayNameChange={vi.fn()}
        onAvatarFileSelect={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const image = screen.getByRole("img", { name: "Jane Doe" });
    const nameInput = screen.getByLabelText("Author name");
    const fileInput = screen.getByLabelText("Profile image");

    expect(
      image.compareDocumentPosition(nameInput) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      nameInput.compareDocumentPosition(fileInput) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("shows the public address with a label", () => {
    render(
      <AuthorProfileEditorView
        profile={profile}
        form={createEditorFormState(profile)}
        isAdminEditingOther={false}
        onDisplayNameChange={vi.fn()}
        onAvatarFileSelect={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("Public address")).toBeInTheDocument();
    expect(screen.getByText(profile.address)).toBeInTheDocument();
  });

  it("shows avatar upload guidance with size and format limits", () => {
    render(
      <AuthorProfileEditorView
        profile={profile}
        form={createEditorFormState(profile)}
        isAdminEditingOther={false}
        onDisplayNameChange={vi.fn()}
        onAvatarFileSelect={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const guidance = screen.getByText(/Allowed formats: PNG, JPEG, WebP/i);
    expect(guidance.textContent).toContain("Maximum size: 128 KB");
    expect(guidance.textContent).not.toContain("488");
  });

  it("forwards display name and file changes", () => {
    const onDisplayNameChange = vi.fn();
    const onAvatarFileSelect = vi.fn();

    render(
      <AuthorProfileEditorView
        profile={profile}
        form={createEditorFormState(profile)}
        isAdminEditingOther={false}
        onDisplayNameChange={onDisplayNameChange}
        onAvatarFileSelect={onAvatarFileSelect}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Author name"), {
      target: { value: "New Name" },
    });
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Profile image"), {
      target: { files: [file] },
    });

    expect(onDisplayNameChange).toHaveBeenCalledWith("New Name");
    expect(onAvatarFileSelect).toHaveBeenCalledWith(file);
  });
});
