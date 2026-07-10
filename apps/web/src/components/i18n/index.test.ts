import { describe, expect, it } from "vitest";

import { LocalizedLink, useLocalizedHref } from "./index";

describe("i18n navigation exports", () => {
  it("re-exports LocalizedLink and useLocalizedHref from the public barrel", () => {
    expect(LocalizedLink).toBeTypeOf("function");
    expect(useLocalizedHref).toBeTypeOf("function");
  });
});
