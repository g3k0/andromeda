"use client";

import { useRouter } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import { WALLET_DISCONNECTED_MESSAGE } from "@/lib/notifications/messages";

function shorten(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletButton() {
  const router = useRouter();
  const { notify } = useNotifications();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect({
    mutation: {
      onSuccess: () => {
        notify({
          variant: "info",
          message: WALLET_DISCONNECTED_MESSAGE,
        });
        router.push("/");
      },
    },
  });

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="rounded-lg border border-andromeda-light/40 px-4 py-2 text-sm font-medium hover:bg-andromeda/20"
      >
        {shorten(address)} · Disconnect
      </button>
    );
  }

  const connector = connectors[0];

  return (
    <button
      onClick={() => connector && connect({ connector })}
      disabled={!connector || isPending}
      className="rounded-lg bg-andromeda px-4 py-2 text-sm font-medium text-white hover:bg-andromeda-dark disabled:opacity-50"
    >
      {isPending ? "Connecting…" : "Connect Wallet"}
    </button>
  );
}
