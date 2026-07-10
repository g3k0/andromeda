import type { MetadataRoute } from "next";

import { buildLocalizedSitemapEntries } from "@/lib/i18n/sitemap";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildLocalizedSitemapEntries();
}
