"use client";

import { bindWalletAction } from "@/app/actions/bind-wallet";
import {
  createSignedWalletPayload,
  type SignMessageFn,
} from "@/lib/auth/client-wallet-auth";
import { requestUserSnapshotRefresh } from "@/lib/users/user-snapshot-sync";

let boundAddress: string | null = null;
let inFlight: Promise<string> | null = null;
let inFlightAddress: string | null = null;

export function clearWalletBindingClient(): void {
  boundAddress = null;
  inFlight = null;
  inFlightAddress = null;
}

export function isWalletBound(address: string): boolean {
  return boundAddress === address.toLowerCase();
}

export function markWalletBound(address: string): void {
  boundAddress = address.toLowerCase();
}

export async function ensureWalletBound(
  address: string,
  signMessageAsync: SignMessageFn,
): Promise<string> {
  const normalized = address.toLowerCase();
  if (boundAddress === normalized) {
    return normalized;
  }

  if (inFlight && inFlightAddress === normalized) {
    return inFlight;
  }

  if (inFlight) {
    await inFlight.catch(() => undefined);
    if (boundAddress === normalized) {
      return normalized;
    }
  }

  inFlightAddress = normalized;
  inFlight = (async () => {
    const signed = await createSignedWalletPayload(address, signMessageAsync);
    await bindWalletAction(signed);
    boundAddress = normalized;
    requestUserSnapshotRefresh();
    return normalized;
  })();

  try {
    return await inFlight;
  } finally {
    if (inFlightAddress === normalized) {
      inFlight = null;
      inFlightAddress = null;
    }
  }
}

export async function whenWalletBound(
  address: string | undefined,
): Promise<void> {
  if (!address) {
    return;
  }

  const normalized = address.toLowerCase();
  if (boundAddress === normalized) {
    return;
  }

  if (inFlight && inFlightAddress === normalized) {
    await inFlight.catch(() => undefined);
  }
}
