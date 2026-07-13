import { describe, expect, it } from "vitest";

import de from "@/locales/de.json";
import en from "@/locales/en.json";
import es from "@/locales/es.json";
import fr from "@/locales/fr.json";
import itLocale from "@/locales/it.json";
import ja from "@/locales/ja.json";
import pt from "@/locales/pt.json";
import ru from "@/locales/ru.json";
import zh from "@/locales/zh.json";

import {
  collectMessageKeys,
  compareLocaleKeyParity,
  formatLocaleKeyParityReport,
} from "./check-key-parity";
import type { MessageTree } from "./types";

describe("collectMessageKeys", () => {
  it("walks nested namespaces", () => {
    const keys = collectMessageKeys({
      nav: { catalog: "Catalog" },
      common: { loading: "Loading…" },
    });

    expect(keys).toEqual(["common.loading", "nav.catalog"]);
  });
});

describe("compareLocaleKeyParity", () => {
  it("reports missing and extra keys", () => {
    const report = compareLocaleKeyParity(
      { a: { one: "1", two: "2" } },
      {
        fr: { a: { one: "1" } },
        de: { a: { one: "1", two: "2", three: "3" }, b: { x: "x" } },
      },
    );

    expect(report.issues).toEqual([
      { locale: "fr", missing: ["a.two"], extra: [] },
      { locale: "de", missing: [], extra: ["a.three", "b.x"] },
    ]);
  });
});

describe("locale JSON key parity", () => {
  it("keeps all locale files aligned with en.json", () => {
    const catalogs: Record<string, MessageTree> = {
      de: de as MessageTree,
      es: es as MessageTree,
      fr: fr as MessageTree,
      it: itLocale as MessageTree,
      ja: ja as MessageTree,
      pt: pt as MessageTree,
      ru: ru as MessageTree,
      zh: zh as MessageTree,
    };

    const report = compareLocaleKeyParity(en as MessageTree, catalogs);
    expect(formatLocaleKeyParityReport(report)).toContain("parity OK");
    expect(report.issues).toEqual([]);
  });
});
