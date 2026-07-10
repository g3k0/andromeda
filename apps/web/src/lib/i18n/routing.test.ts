import { describe, expect, it } from "vitest";

import {
  getLocaleFromPathname,
  localizedPath,
  resolveLocaleFromPathname,
  stripLocalePrefix,
  switchLocaleInPath,
} from "./routing";

describe("stripLocalePrefix", () => {
  it("removes supported locale segments", () => {
    expect(stripLocalePrefix("/it/works")).toBe("/works");
    expect(stripLocalePrefix("/ja/works/3")).toBe("/works/3");
    expect(stripLocalePrefix("/en")).toBe("/");
  });

  it("returns the path unchanged when no locale is present", () => {
    expect(stripLocalePrefix("/works/3")).toBe("/works/3");
    expect(stripLocalePrefix("/")).toBe("/");
  });
});

describe("localizedPath", () => {
  it("prefixes logical paths", () => {
    expect(localizedPath("it", "/works")).toBe("/it/works");
    expect(localizedPath("fr", "/works/42")).toBe("/fr/works/42");
    expect(localizedPath("en", "/")).toBe("/en");
  });

  it("replaces an existing locale prefix", () => {
    expect(localizedPath("de", "/it/works")).toBe("/de/works");
  });
});

describe("switchLocaleInPath", () => {
  it("swaps locale on nested paths", () => {
    expect(switchLocaleInPath("/it/works/3", "de")).toBe("/de/works/3");
  });

  it("adds a locale when missing", () => {
    expect(switchLocaleInPath("/library", "es")).toBe("/es/library");
  });

  it("handles locale-only paths", () => {
    expect(switchLocaleInPath("/it", "fr")).toBe("/fr");
  });
});

describe("getLocaleFromPathname", () => {
  it("reads locale prefixes", () => {
    expect(getLocaleFromPathname("/pt/works")).toBe("pt");
    expect(getLocaleFromPathname("/works")).toBeNull();
  });

  it("resolves locale with English fallback", () => {
    expect(resolveLocaleFromPathname("/zh/about")).toBe("zh");
    expect(resolveLocaleFromPathname("/about")).toBe("en");
  });
});
