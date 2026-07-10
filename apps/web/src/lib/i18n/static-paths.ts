/** Logical paths for public static pages included in the multilingual sitemap. */
export const STATIC_INDEXABLE_PATHS = [
  "/",
  "/works",
  "/library",
  "/about",
] as const;

export type StaticIndexablePath = (typeof STATIC_INDEXABLE_PATHS)[number];
