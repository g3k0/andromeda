import { describe, expect, it } from "vitest";

import { LOCALE_COOKIE, parseLocaleCookie } from "./cookie";

describe("parseLocaleCookie", () => {
  it("accepts supported locale codes", () => {
    expect(parseLocaleCookie("it")).toBe("it");
    expect(parseLocaleCookie("ja")).toBe("ja");
  });

  it("rejects unknown or malformed values", () => {
    expect(parseLocaleCookie("")).toBeNull();
    expect(parseLocaleCookie("xx")).toBeNull();
    expect(parseLocaleCookie("en-US")).toBeNull();
    expect(parseLocaleCookie("<script>")).toBeNull();
  });

  it("exports the cookie name constant", () => {
    expect(LOCALE_COOKIE).toBe("andromeda_locale");
  });
});
