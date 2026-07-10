import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";

import { I18nProvider } from "./I18nProvider";
import type { SupportedLocale } from "./locales";

export function renderWithI18n(
  ui: ReactElement,
  locale: SupportedLocale = "en",
  options?: RenderOptions,
) {
  return render(<I18nProvider locale={locale}>{ui}</I18nProvider>, options);
}
