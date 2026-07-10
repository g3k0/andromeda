import type { SignMessageFn } from "@/lib/auth/client-wallet-auth";
import type { WalletSessionStatus } from "@/lib/auth/wallet-session";
import type { TranslateFn } from "@/lib/i18n/translate";

export type EnsureAdminSessionDeps = {
  getStatus: () => Promise<WalletSessionStatus>;
  isReady: () => Promise<boolean>;
  sign: (address: string, signMessage: SignMessageFn) => Promise<{
    address: string;
    message: string;
    signature: `0x${string}`;
  }>;
  establish: (payload: {
    address: string;
    message: string;
    signature: `0x${string}`;
  }) => Promise<WalletSessionStatus>;
};

export async function ensureAdminSession(
  address: string,
  signMessageAsync: SignMessageFn,
  deps: EnsureAdminSessionDeps,
): Promise<void> {
  const status = await deps.getStatus();
  if (status.active && (await deps.isReady())) {
    return;
  }

  const signed = await deps.sign(address, signMessageAsync);
  await deps.establish(signed);
}

export function adminSessionErrorMessage(error: unknown, t: TranslateFn): string {
  if (error instanceof Error && error.message.includes("expired")) {
    return t("admin.session.expired");
  }
  return t("admin.session.authorizeFailed");
}
