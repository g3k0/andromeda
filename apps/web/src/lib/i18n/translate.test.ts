import { describe, expect, it } from "vitest";

import {
  getMessageByPath,
  getMessageCatalog,
  registerMessageCatalog,
  resetMessageCatalogsForTests,
} from "./messages";
import { createTranslateFn, translate } from "./translate";

describe("getMessageByPath", () => {
  it("resolves nested keys", () => {
    const catalog = getMessageCatalog("en");
    expect(getMessageByPath(catalog, "meta.siteName")).toBe("Andromeda");
    expect(getMessageByPath(catalog, "locales.it")).toBe("Italiano");
  });

  it("returns undefined for missing keys", () => {
    expect(getMessageByPath(getMessageCatalog("en"), "missing.key")).toBeUndefined();
  });
});

describe("translate", () => {
  it("returns English messages for the default locale", () => {
    expect(translate("en", "meta.siteName")).toBe("Andromeda");
  });

  it("falls back to English when a locale catalog is unavailable", () => {
    expect(translate("fr", "meta.siteName")).toBe("Andromeda");
  });

  it("labels missing keys in development", () => {
    expect(translate("en", "does.not.exist")).toBe("[missing:does.not.exist]");
  });

  it("creates a bound translate function", () => {
    const t = createTranslateFn("en");
    expect(t("locales.fr")).toBe("Français");
  });

  it("uses a registered locale catalog when present", () => {
    registerMessageCatalog("fr", {
      meta: { siteName: "Andromeda FR" },
    });
    expect(translate("fr", "meta.siteName")).toBe("Andromeda FR");
    resetMessageCatalogsForTests();
  });
});
