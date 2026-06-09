"use server";

import { cookies } from "next/headers";
import { enforceActionRateLimit } from "@/lib/auth/action-rate-limit";
import {
  buildWalletBindingCookieOptions,
  WALLET_BINDING_COOKIE_NAME,
  WALLET_BINDING_TTL_MS,
} from "@/lib/auth/wallet-binding-cookie";
import { verifyWalletSignature } from "@/lib/auth/verify-wallet";
import { walletAuthSchema } from "@/lib/authors/schemas";
import { getUserService } from "@/lib/users/server";

export async function bindWalletAction(input: unknown): Promise<{
  address: string;
}> {
  const body = walletAuthSchema.parse(input);
  await enforceActionRateLimit(`bind-wallet:${body.address}`);

  const address = await verifyWalletSignature(body);
  const service = await getUserService();
  await service.findOrCreateByWallet(address);

  const expiresAt = new Date(Date.now() + WALLET_BINDING_TTL_MS);
  const cookieStore = await cookies();
  cookieStore.set(
    WALLET_BINDING_COOKIE_NAME,
    address,
    buildWalletBindingCookieOptions(expiresAt),
  );

  return { address };
}

export async function getBoundWalletAddressAction(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(WALLET_BINDING_COOKIE_NAME)?.value ?? null;
}
