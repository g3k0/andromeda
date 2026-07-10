/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { I18nProvider } from "@/lib/i18n/I18nProvider";
import type { LibraryCopyDto } from "@/lib/works/library-service";

import { LibraryList } from "./LibraryList";

const COPY: LibraryCopyDto = {
  tokenId: "42",
  workId: "7",
  copyNumber: 3,
  editionSize: "10",
  owner: "0x2222222222222222222222222222222222222222",
  tbaAddress: null,
  envelopeCid: null,
  metadataURI: null,
};

describe("LibraryList", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders owned copies with localized labels", () => {
    render(
      <I18nProvider locale="en">
        <LibraryList copies={[COPY]} loading={false} error={null} />
      </I18nProvider>,
    );

    expect(screen.getByText("Work #7")).toBeInTheDocument();
    expect(screen.getByText(/Copy #3 \/ 10/)).toBeInTheDocument();
    expect(screen.getByText("Read →")).toBeInTheDocument();
  });

  it("renders the empty state with a catalog link", () => {
    render(
      <I18nProvider locale="en">
        <LibraryList copies={[]} loading={false} error={null} />
      </I18nProvider>,
    );

    expect(screen.getByRole("link", { name: "catalog" })).toHaveAttribute(
      "href",
      "/en/works",
    );
  });
});
