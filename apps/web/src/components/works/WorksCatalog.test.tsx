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
import type { WorkView } from "@/lib/works/work-view";

import { WorksCatalog } from "./WorksCatalog";

const WORK: WorkView = {
  workId: "1",
  title: "The Star Gate",
  description: "A novella",
  coverImageUrl: null,
  priceLabel: "1 POL",
  remainingCopies: "7",
  soldOut: false,
  author: "0x1111111111111111111111111111111111111111",
  active: true,
};

function renderCatalog(works: WorkView[] = [WORK], locale: "en" | "it" = "en") {
  return render(
    <I18nProvider locale={locale}>
      <WorksCatalog works={works} />
    </I18nProvider>,
  );
}

describe("WorksCatalog", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the catalog heading and work card", () => {
    renderCatalog();

    expect(screen.getByRole("heading", { name: "Catalog" })).toBeInTheDocument();
    expect(screen.getByText("The Star Gate")).toBeInTheDocument();
    expect(screen.getByText(/7 copies left/)).toBeInTheDocument();
  });

  it("renders an empty state", () => {
    renderCatalog([]);

    expect(
      screen.getByText("No works have been published yet."),
    ).toBeInTheDocument();
  });

  it("localizes the heading for Italian visitors", () => {
    renderCatalog([WORK], "it");

    expect(screen.getByRole("heading", { name: "Catalogo" })).toBeInTheDocument();
  });
});
