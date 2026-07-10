import type { SignMessageFn } from "@/lib/auth/client-wallet-auth";
import type { WalletSessionStatus } from "@/lib/auth/wallet-session";
import { WalletAuthExpiredError } from "@/lib/auth/errors";
import { translateClientError } from "@/lib/i18n/api-error-messages";
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
  if (error instanceof WalletAuthExpiredError) {
    return t("admin.session.expired");
  }

  const translated = translateClientError(t, error);
  if (translated !== t("api.errors.unexpected")) {
    return translated;
  }

  return t("admin.session.authorizeFailed");
}
