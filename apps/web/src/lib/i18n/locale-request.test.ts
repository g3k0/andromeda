import { describe, expect, it } from "vitest";

import { resolveLocaleRequest } from "./locale-request";

describe("resolveLocaleRequest", () => {
  it("continues when the pathname already has a supported locale", () => {
    expect(
      resolveLocaleRequest({
        pathname: "/it/works",
        cookieValue: "en",
      }),
    ).toEqual({ action: "continue", locale: "it" });
  });

  it("redirects legacy paths using the locale cookie", () => {
    expect(
      resolveLocaleRequest({
        pathname: "/works",
        cookieValue: "it",
      }),
    ).toEqual({
      action: "redirect",
      locale: "it",
      pathname: "/it/works",
    });
  });

  it("redirects the root path using Accept-Language when no cookie is set", () => {
    expect(
      resolveLocaleRequest({
        pathname: "/",
        acceptLanguage: "fr-FR,fr;q=0.9",
      }),
    ).toEqual({
      action: "redirect",
      locale: "fr",
      pathname: "/fr",
    });
  });

  it("falls back to English when detect and cookie are unavailable", () => {
    expect(
      resolveLocaleRequest({
        pathname: "/library",
      }),
    ).toEqual({
      action: "redirect",
      locale: "en",
      pathname: "/en/library",
    });
  });

  it("rewrites unsupported locale prefixes to English", () => {
    expect(
      resolveLocaleRequest({
        pathname: "/xx/works",
        cookieValue: "it",
      }),
    ).toEqual({
      action: "redirect",
      locale: "en",
      pathname: "/en/works",
    });
  });
});
