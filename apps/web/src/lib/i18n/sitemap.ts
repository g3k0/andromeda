import type { MetadataRoute } from "next";

import { SUPPORTED_LOCALE_CODES } from "./locales";
import { localizedPath } from "./routing";
import { buildAlternateLanguages, resolveSiteBaseUrl } from "./seo";
import { STATIC_INDEXABLE_PATHS } from "./static-paths";

function toAbsoluteUrl(baseUrl: string, path: string): string {
  return `${baseUrl}${path}`;
}

/** Builds sitemap entries for every static page in every supported locale. */
export function buildLocalizedSitemapEntries(
  baseUrl = resolveSiteBaseUrl(),
  lastModified: Date = new Date(),
): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const logicalPath of STATIC_INDEXABLE_PATHS) {
    const relativeAlternates = buildAlternateLanguages(logicalPath);
    const absoluteAlternates = Object.fromEntries(
      Object.entries(relativeAlternates).map(([hreflang, path]) => [
        hreflang,
        toAbsoluteUrl(baseUrl, path),
      ]),
    );

    for (const locale of SUPPORTED_LOCALE_CODES) {
      entries.push({
        url: toAbsoluteUrl(baseUrl, localizedPath(locale, logicalPath)),
        lastModified,
        alternates: {
          languages: absoluteAlternates,
        },
      });
    }
  }

  return entries;
}
