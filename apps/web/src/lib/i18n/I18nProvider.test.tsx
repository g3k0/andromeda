/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "./I18nProvider";
import { useLocale } from "./use-locale";
import { useTranslation } from "./use-translation";

function TranslationProbe() {
  const { locale, t } = useTranslation();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="label">{t("locales.it")}</span>
    </div>
  );
}

afterEach(() => {
  cleanup();
});

describe("I18nProvider", () => {
  it("provides locale and translate function to descendants", () => {
    render(
      <I18nProvider locale="en">
        <TranslationProbe />
      </I18nProvider>,
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByTestId("label")).toHaveTextContent("Italiano");
  });

  it("throws when hooks are used outside the provider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<TranslationProbe />)).toThrow(
      /useI18n must be used within an I18nProvider/,
    );

    consoleError.mockRestore();
  });
});

describe("useLocale", () => {
  it("returns the provider locale", () => {
    function LocaleProbe() {
      return <span data-testid="locale">{useLocale()}</span>;
    }

    render(
      <I18nProvider locale="fr">
        <LocaleProbe />
      </I18nProvider>,
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("fr");
  });
});
