"use client";

import { useEffect, useRef } from "react";

import { provisionAllPendingEnvelopesForAuthor } from "@/lib/works/mint-envelope-author-client";

type UseWorkPublishPendingEnvelopesInput = {
  canPublish: boolean;
  authorAddress: string;
  address: `0x${string}` | undefined;
  signMessageAsync: (args: { message: string }) => Promise<`0x${string}`>;
};

export function useWorkPublishPendingEnvelopes({
  canPublish,
  authorAddress,
  address,
  signMessageAsync,
}: UseWorkPublishPendingEnvelopesInput): void {
  const provisioningPendingEnvelopesRef = useRef(false);

  useEffect(() => {
    if (!canPublish || !address) {
      return;
    }

    let cancelled = false;

    async function provisionPendingEnvelopes() {
      if (!address || provisioningPendingEnvelopesRef.current) {
        return;
      }

      provisioningPendingEnvelopesRef.current = true;

      try {
        await provisionAllPendingEnvelopesForAuthor({
          authorAddress,
          address,
          signMessageAsync,
        });
      } catch {
        // Pending envelope provisioning is best-effort while the author session is open.
      } finally {
        provisioningPendingEnvelopesRef.current = false;
      }
    }

    void provisionPendingEnvelopes();
    const intervalId = window.setInterval(() => {
      if (!cancelled) {
        void provisionPendingEnvelopes();
      }
    }, 15_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [canPublish, authorAddress, address, signMessageAsync]);
}
