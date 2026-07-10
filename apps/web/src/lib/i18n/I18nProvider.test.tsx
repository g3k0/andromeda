/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useParams } from "next/navigation";

import { I18nProvider, useI18n } from "./I18nProvider";
import { useLocale } from "./use-locale";
import { useTranslation } from "./use-translation";

const mockedUseParams = vi.mocked(useParams);

function I18nProbe() {
  const { locale, t } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="label">{t("locales.it")}</span>
    </div>
  );
}

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
  mockedUseParams.mockReturnValue({ locale: "en" });
});

describe("I18nProvider", () => {
  it("provides locale and translate function to descendants", () => {
    render(
      <I18nProvider locale="en">
        <I18nProbe />
      </I18nProvider>,
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByTestId("label")).toHaveTextContent("Italiano");
  });

  it("throws when useI18n is used outside the provider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<I18nProbe />)).toThrow(
      /useI18n must be used within an I18nProvider/,
    );

    consoleError.mockRestore();
  });
});

describe("useTranslation", () => {
  it("binds translate to the active route locale", () => {
    render(<TranslationProbe />);

    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByTestId("label")).toHaveTextContent("Italiano");
  });
});

describe("useLocale", () => {
  it("returns the locale route param", () => {
    mockedUseParams.mockReturnValue({ locale: "fr" });

    function LocaleProbe() {
      return <span data-testid="locale">{useLocale()}</span>;
    }

    render(<LocaleProbe />);

    expect(screen.getByTestId("locale")).toHaveTextContent("fr");
  });
});
