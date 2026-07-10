import type { MessageTree } from "./types";

export type LocaleKeyParityIssue = {
  locale: string;
  missing: string[];
  extra: string[];
};

export type LocaleKeyParityReport = {
  canonicalLocale: string;
  issues: LocaleKeyParityIssue[];
};

/** Collects dot-separated translation keys from a nested message tree. */
export function collectMessageKeys(
  tree: MessageTree,
  prefix = "",
): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(tree)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      keys.push(fullKey);
      continue;
    }

    keys.push(...collectMessageKeys(value, fullKey));
  }

  return keys.sort();
}

/** Compares locale catalogs against a canonical tree and reports mismatches. */
export function compareLocaleKeyParity(
  canonical: MessageTree,
  locales: Record<string, MessageTree>,
  canonicalLocale = "en",
): LocaleKeyParityReport {
  const canonicalKeys = new Set(collectMessageKeys(canonical));
  const issues: LocaleKeyParityIssue[] = [];

  for (const [locale, catalog] of Object.entries(locales)) {
    if (locale === canonicalLocale) {
      continue;
    }

    const localeKeys = new Set(collectMessageKeys(catalog));
    const missing = [...canonicalKeys].filter((key) => !localeKeys.has(key));
    const extra = [...localeKeys].filter((key) => !canonicalKeys.has(key));

    if (missing.length > 0 || extra.length > 0) {
      issues.push({ locale, missing, extra });
    }
  }

  return {
    canonicalLocale,
    issues,
  };
}

export function formatLocaleKeyParityReport(report: LocaleKeyParityReport): string {
  if (report.issues.length === 0) {
    return `Locale key parity OK (canonical: ${report.canonicalLocale}).`;
  }

  return report.issues
    .map((issue) => {
      const parts = [`${issue.locale}:`];
      if (issue.missing.length > 0) {
        parts.push(`  missing (${issue.missing.length}): ${issue.missing.join(", ")}`);
      }
      if (issue.extra.length > 0) {
        parts.push(`  extra (${issue.extra.length}): ${issue.extra.join(", ")}`);
      }
      return parts.join("\n");
    })
    .join("\n\n");
}
