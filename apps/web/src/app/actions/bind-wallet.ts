"use server";

import { cookies } from "next/headers";
import { enforceActionRateLimit } from "@/lib/auth/action-rate-limit";
import { getAuth, verifyAuth } from "@/lib/auth/require-auth";
import { setWalletBindingCookie } from "@/lib/auth/set-wallet-binding-cookie";
import { WALLET_BINDING_COOKIE_NAME } from "@/lib/auth/wallet-binding-cookie";
import { walletAuthSchema } from "@/lib/authors/schemas";
import { getUserService } from "@/lib/users/server";

export async function bindWalletAction(input: unknown): Promise<{
  address: string;
}> {
  const body = walletAuthSchema.parse(input);
  const address = await verifyAuth(body);
  const [, service] = await Promise.all([
    enforceActionRateLimit(`bind-wallet:${address}`),
    getUserService(),
  ]);
  await service.findOrCreateByWallet(address);

  await setWalletBindingCookie(address);

  return { address };
}

export async function getBoundWalletAddressAction(): Promise<string | null> {
  await getAuth().catch(() => null);
  const cookieStore = await cookies();
  return cookieStore.get(WALLET_BINDING_COOKIE_NAME)?.value ?? null;
}
