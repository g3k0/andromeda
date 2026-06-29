/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AUTHOR_AVATAR_PLACEHOLDER_PATH } from "./constants";
import { AuthorAvatar, AuthorFramedAvatar } from "./AuthorAvatar";

describe("AuthorAvatar", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the placeholder when avatarUrl is null", () => {
    render(<AuthorAvatar avatarUrl={null} alt="Jane Doe" />);

    const image = screen.getByRole("img", { name: "Jane Doe" });
    expect(image).toHaveAttribute("src", AUTHOR_AVATAR_PLACEHOLDER_PATH);
    expect(image).toHaveAttribute("width", "96");
    expect(image).toHaveAttribute("height", "96");
    expect(image).toHaveClass("rounded-full");
  });

  it("renders a custom avatar URL", () => {
    render(<AuthorAvatar avatarUrl="ipfs://custom-avatar" />);

    expect(screen.getByRole("img", { name: "Author profile" })).toHaveAttribute(
      "src",
      "https://ipfs.io/ipfs/custom-avatar",
    );
  });

  it("applies custom size and className", () => {
    render(
      <AuthorAvatar
        avatarUrl={null}
        size={48}
        className="ring-2 ring-andromeda-light"
      />,
    );

    const image = screen.getByRole("img", { name: "Author profile" });
    expect(image).toHaveAttribute("width", "48");
    expect(image).toHaveAttribute("height", "48");
    expect(image).toHaveClass("ring-2", "ring-andromeda-light");
  });

  it("uses the default alt text when alt is omitted", () => {
    render(<AuthorAvatar avatarUrl={null} />);
    expect(screen.getByRole("img", { name: "Author profile" })).toBeDefined();
  });
});

describe("AuthorFramedAvatar", () => {
  afterEach(() => {
    cleanup();
  });

  it("wraps the avatar in a primary border with spacing", () => {
    const { container } = render(<AuthorFramedAvatar avatarUrl={null} alt="Jane Doe" />);

    const frame = container.firstElementChild;
    expect(frame).toHaveClass("rounded-full", "border-andromeda", "border-2", "p-1.5");
    expect(screen.getByRole("img", { name: "Jane Doe" })).toBeInTheDocument();
  });
});
