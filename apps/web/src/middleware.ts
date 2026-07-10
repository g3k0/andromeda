import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { LOCALE_COOKIE } from "@/lib/i18n/cookie";
import { resolveLocaleRequest } from "@/lib/i18n/locale-request";

export function middleware(request: NextRequest) {
  const resolution = resolveLocaleRequest({
    pathname: request.nextUrl.pathname,
    cookieValue: request.cookies.get(LOCALE_COOKIE)?.value,
    acceptLanguage: request.headers.get("accept-language"),
  });

  if (resolution.action === "continue") {
    const response = NextResponse.next();
    response.cookies.set(LOCALE_COOKIE, resolution.locale, {
      path: "/",
      sameSite: "lax",
    });
    return response;
  }

  const url = request.nextUrl.clone();
  url.pathname = resolution.pathname;
  const response = NextResponse.redirect(url, 308);
  response.cookies.set(LOCALE_COOKIE, resolution.locale, {
    path: "/",
    sameSite: "lax",
  });
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
