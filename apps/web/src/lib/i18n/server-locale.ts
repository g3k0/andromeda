import { cookies } from "next/headers";

import { LOCALE_COOKIE, parseLocaleCookie } from "./cookie";
import { DEFAULT_LOCALE, type SupportedLocale } from "./locales";

/** Resolves the active locale from the synced cookie on server routes. */
export async function getRequestLocale(): Promise<SupportedLocale> {
  const cookieStore = await cookies();
  return (
    parseLocaleCookie(cookieStore.get(LOCALE_COOKIE)?.value) ?? DEFAULT_LOCALE
  );
}
