import "server-only";

import { cookies } from "next/headers";
import {
  parseCookieHeader,
  WALLET_BINDING_COOKIE_NAME,
} from "@/lib/auth/wallet-binding-cookie";
import { getWalletSessionService } from "@/lib/auth/wallet-session-server";
import { WALLET_SESSION_COOKIE_NAME } from "@/lib/auth/wallet-session-cookies";
import { normalizeAddress } from "./address";
import { authorPagePath } from "./onboarding";
import { getAuthorService } from "./server";

export async function resolveAuthorIndexServerRedirect(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const sessionId = parseCookieHeader(cookieHeader, WALLET_SESSION_COOKIE_NAME);

  let address: string | null = null;

  if (sessionId) {
    const sessionService = await getWalletSessionService();
    const snapshot = await sessionService.resolve(sessionId);
    address = snapshot?.address ?? null;
  }

  if (!address) {
    address =
      parseCookieHeader(cookieHeader, WALLET_BINDING_COOKIE_NAME) ?? null;
  }

  const normalized = address ? normalizeAddress(address) : null;
  if (!normalized) {
    return null;
  }

  const authorService = await getAuthorService();
  if (await authorService.hasAuthorProfile(normalized)) {
    return authorPagePath(normalized);
  }

  return null;
}
