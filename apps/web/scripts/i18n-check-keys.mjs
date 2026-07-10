#!/usr/bin/env node
/**
 * Verifies that every locale JSON file has the same key structure as en.json.
 *
 * Usage (from apps/web):
 *   node scripts/i18n-check-keys.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(scriptDir, "../src/locales");
const canonicalLocale = "en";
const localeFiles = fs
  .readdirSync(localesDir)
  .filter((file) => file.endsWith(".json"))
  .sort();

function collectMessageKeys(tree, prefix = "") {
  const keys = [];

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

function loadCatalog(locale) {
  const filePath = path.join(localesDir, `${locale}.json`);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const canonical = loadCatalog(canonicalLocale);
const canonicalKeys = new Set(collectMessageKeys(canonical));
const issues = [];

for (const file of localeFiles) {
  const locale = file.replace(/\.json$/, "");
  if (locale === canonicalLocale) {
    continue;
  }

  const catalog = loadCatalog(locale);
  const localeKeys = new Set(collectMessageKeys(catalog));
  const missing = [...canonicalKeys].filter((key) => !localeKeys.has(key));
  const extra = [...localeKeys].filter((key) => !canonicalKeys.has(key));

  if (missing.length > 0 || extra.length > 0) {
    issues.push({ locale, missing, extra });
  }
}

if (issues.length === 0) {
  console.log(`Locale key parity OK (canonical: ${canonicalLocale}).`);
  process.exit(0);
}

for (const issue of issues) {
  console.error(`${issue.locale}:`);
  if (issue.missing.length > 0) {
    console.error(`  missing (${issue.missing.length}): ${issue.missing.join(", ")}`);
  }
  if (issue.extra.length > 0) {
    console.error(`  extra (${issue.extra.length}): ${issue.extra.join(", ")}`);
  }
}

process.exit(1);
