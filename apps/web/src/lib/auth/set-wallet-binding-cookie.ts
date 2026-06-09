import "server-only";

import { cookies } from "next/headers";
import { getWalletBindingTtlMs } from "@/lib/config/auth";
import {
  buildWalletBindingCookieOptions,
  WALLET_BINDING_COOKIE_NAME,
} from "./wallet-binding-cookie";

export async function setWalletBindingCookie(address: string): Promise<void> {
  const expiresAt = new Date(Date.now() + getWalletBindingTtlMs());
  const cookieStore = await cookies();
  cookieStore.set(
    WALLET_BINDING_COOKIE_NAME,
    address,
    buildWalletBindingCookieOptions(expiresAt),
  );
}
