"use client";

import { useEffect, useRef } from "react";
import { usePublicClient, useWriteContract } from "wagmi";

import { andromedaWorksAbi } from "@/lib/chain/contract";
import { getContractAddress } from "@/lib/config/public-env";
import { provisionAllPendingEnvelopesForAuthor } from "@/lib/works/mint-envelope-author-client";
import { buildSetCopyEnvelopeRequest } from "@/lib/works/mint-copy-tx";

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
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  useEffect(() => {
    if (!canPublish || !address || !publicClient) {
      return;
    }

    let cancelled = false;

    async function provisionPendingEnvelopes() {
      if (!address || !publicClient || provisioningPendingEnvelopesRef.current) {
        return;
      }

      provisioningPendingEnvelopesRef.current = true;

      try {
        const provisioned = await provisionAllPendingEnvelopesForAuthor({
          authorAddress,
          address,
          signMessageAsync,
        });

        // Sequential on purpose: same-wallet writes must wait for prior receipts (nonce).
        let previousHash: `0x${string}` | undefined;
        for (const entry of provisioned) {
          if (cancelled) {
            return;
          }
          if (previousHash !== undefined) {
            await publicClient.waitForTransactionReceipt({ hash: previousHash });
          }
          previousHash = await writeContractAsync(
            buildSetCopyEnvelopeRequest({
              tokenId: entry.tokenId,
              envelopeUri: entry.envelopeUri,
              contractAddress: getContractAddress(),
              abi: andromedaWorksAbi,
            }),
          );
        }
        if (!cancelled && previousHash !== undefined) {
          await publicClient.waitForTransactionReceipt({ hash: previousHash });
        }
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
  }, [
    canPublish,
    authorAddress,
    address,
    signMessageAsync,
    writeContractAsync,
    publicClient,
  ]);
}
