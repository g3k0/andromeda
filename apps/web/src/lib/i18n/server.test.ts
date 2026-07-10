import { describe, expect, it } from "vitest";

import { getServerTranslations } from "./server";

describe("getServerTranslations", () => {
  it("returns a bound translate function for server components", () => {
    const { locale, t } = getServerTranslations("en");
    expect(locale).toBe("en");
    expect(t("meta.siteName")).toBe("Andromeda");
  });
});
