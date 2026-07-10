"use client";

import { useAccount, useConnect } from "wagmi";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { useTranslation } from "@/lib/i18n/use-translation";

export function WalletButton() {
  const { isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { t } = useTranslation();

  if (isConnected) {
    return null;
  }

  const connector = connectors[0];

  return (
    <button
      onClick={() => connector && connect({ connector })}
      disabled={!connector || isConnecting}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-andromeda px-4 py-2 text-sm font-medium text-white hover:bg-andromeda-dark disabled:opacity-50"
    >
      {isConnecting ? (
        <LoadingSpinner size="sm" label={t("wallet.connectingAria")} />
      ) : null}
      {isConnecting ? t("wallet.connecting") : t("wallet.connect")}
    </button>
  );
}
