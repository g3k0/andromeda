"use client";

import { useReducer } from "react";
import { useAccount, useReadContract, useSignMessage } from "wagmi";

import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { formErrorClassName } from "@/components/form/form-field-styles";
import { andromedaWorksAbi } from "@/lib/chain/contract";
import { isCopyOwner } from "@/lib/works/reader-access";
import { decodeUtf8, readWorkContent } from "@/lib/works/reader-client";
import {
  READER_KEY_SIGNATURE_MESSAGE,
  createReaderSignerFromSignature,
} from "@/lib/works/reader-signer";
import {
  createReaderState,
  isReaderBusy,
  readerReducer,
} from "@/lib/works/reader-state";

export type WorkReaderClientProps = {
  tokenId: string;
  metadataUrl: string;
  envelopeUrl: string | null;
  gatewayBaseUrl: string;
  contractAddress: `0x${string}`;
};

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
      {children}
    </p>
  );
}

export function WorkReaderClient({
  tokenId,
  metadataUrl,
  envelopeUrl,
  gatewayBaseUrl,
  contractAddress,
}: WorkReaderClientProps) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { data: ownerData, isLoading: ownerLoading } = useReadContract({
    abi: andromedaWorksAbi,
    address: contractAddress,
    functionName: "ownerOf",
    args: [BigInt(tokenId)],
  });

  const [state, dispatch] = useReducer(
    readerReducer,
    undefined,
    createReaderState,
  );

  const owner = typeof ownerData === "string" ? ownerData : null;
  const isOwner = owner ? isCopyOwner(owner, address ?? null) : false;
  const busy = isReaderBusy(state.status);

  async function handleRead() {
    if (!envelopeUrl) {
      dispatch({
        type: "decrypt_failed",
        message: "The reading key for this copy is not available yet.",
      });
      return;
    }

    dispatch({ type: "decrypt_started" });
    try {
      const signature = await signMessageAsync({
        message: READER_KEY_SIGNATURE_MESSAGE,
      });
      const bytes = await readWorkContent({
        metadataUrl,
        envelopeUrl,
        gatewayBaseUrl,
        tbaSigner: createReaderSignerFromSignature(signature as `0x${string}`),
        fetchJson: async (url) => {
          const response = await fetch(url, { cache: "no-store" });
          if (!response.ok) {
            throw new Error("Failed to load work metadata.");
          }
          return response.json();
        },
        fetchBytes: async (url) => {
          const response = await fetch(url, { cache: "no-store" });
          if (!response.ok) {
            throw new Error("Failed to load encrypted content.");
          }
          return new Uint8Array(await response.arrayBuffer());
        },
      });
      dispatch({ type: "decrypt_succeeded", text: decodeUtf8(bytes) });
    } catch (cause) {
      dispatch({
        type: "decrypt_failed",
        message:
          cause instanceof Error
            ? cause.message
            : "Failed to decrypt this copy.",
      });
    }
  }

  if (!isConnected) {
    return <Notice>Connect your wallet to read this copy.</Notice>;
  }

  if (ownerLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-white/60">
        <LoadingSpinner size="sm" /> Verifying ownership…
      </div>
    );
  }

  if (!isOwner) {
    return <Notice>Only the owner of this copy can read it.</Notice>;
  }

  if (state.text !== null) {
    return (
      <article className="whitespace-pre-wrap rounded-xl border border-white/10 bg-white/5 p-6 text-sm leading-relaxed text-white/90">
        {state.text}
      </article>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => {
          void handleRead();
        }}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg bg-andromeda px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? <LoadingSpinner size="sm" /> : null}
        {busy ? "Decrypting…" : "Decrypt & read"}
      </button>

      <p className="text-xs text-white/50">
        You will be asked to sign a message. Your key stays in your browser — the
        server never sees the decrypted text.
      </p>

      {state.errorMessage ? (
        <p className={formErrorClassName} role="alert">
          {state.errorMessage}
        </p>
      ) : null}
    </div>
  );
}
