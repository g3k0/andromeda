"use client";

import { useReducer, useRef } from "react";
import { useAccount, useSignMessage, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { createSignedWalletPayload } from "@/lib/auth/client-wallet-auth";
import { andromedaWorksAbi } from "@/lib/chain/contract";
import { getContractAddress } from "@/lib/config/public-env";
import { storeWorkContentKey } from "@/lib/works/content-key-session";
import { uploadWorkPublishPayload } from "@/lib/works/work-publish-client";
import {
  createWorkPublishClientState,
  workPublishClientReducer,
} from "@/lib/works/work-publish-client-state";
import {
  hasWorkPublishFormErrors,
  parseRegisterWorkParams,
  validateWorkPublishForm,
  type WorkPublishFormValues,
} from "@/lib/works/work-publish-form-state";
import { useLoading } from "@/components/loading/LoadingProvider";
import { WorkPublishView } from "./WorkPublishView";

export type WorkPublishClientProps = {
  authorAddress: string;
};

export function WorkPublishClient({ authorAddress }: WorkPublishClientProps) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();
  const { runWithLoading } = useLoading();

  const [state, dispatch] = useReducer(
    workPublishClientReducer,
    undefined,
    createWorkPublishClientState,
  );
  const coverImageRef = useRef<File | null>(null);
  const metadataUriRef = useRef<string | null>(null);

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: state.txHash ?? undefined,
  });

  const canPublish =
    isConnected &&
    address?.toLowerCase() === authorAddress.toLowerCase();

  function updateField(field: keyof WorkPublishFormValues, value: string) {
    dispatch({ type: "field_change", field, value });
  }

  async function handleUpload() {
    const coverImage = coverImageRef.current;

    if (!canPublish || !coverImage) {
      dispatch({
        type: "set_error_message",
        message: "Connect the author wallet to publish.",
      });
      return;
    }

    const nextErrors = validateWorkPublishForm(state.values, coverImage);
    dispatch({ type: "set_errors", errors: nextErrors });
    if (hasWorkPublishFormErrors(nextErrors)) {
      return;
    }

    dispatch({ type: "set_error_message", message: null });

    try {
      await runWithLoading(async () => {
        dispatch({ type: "set_step", step: "encrypting" });
        const walletAuth = await createSignedWalletPayload(
          address,
          signMessageAsync,
        );

        dispatch({ type: "set_step", step: "uploading" });
        const result = await uploadWorkPublishPayload({
          values: state.values,
          coverImage,
          walletAuth,
        });

        metadataUriRef.current = result.metadataUri;
        // Content key stays in the browser for PR7 mint envelopes — never sent to the server.
        storeWorkContentKey(result.metadataUri, result.contentKey);
        dispatch({ type: "upload_success", metadata: result.metadata });
      }, "Uploading encrypted work…");
    } catch (error) {
      dispatch({ type: "set_step", step: "error" });
      dispatch({
        type: "set_error_message",
        message: error instanceof Error ? error.message : "Work upload failed.",
      });
    }
  }

  async function handleRegister() {
    const metadataUri = metadataUriRef.current;

    if (!metadataUri) {
      return;
    }

    if (!canPublish) {
      dispatch({
        type: "set_error_message",
        message: "Connect the author wallet to register the work.",
      });
      return;
    }

    dispatch({ type: "set_error_message", message: null });
    dispatch({ type: "set_step", step: "registering" });

    try {
      const { priceWei, maxCopies } = parseRegisterWorkParams(state.values);
      const hash = await writeContractAsync({
        abi: andromedaWorksAbi,
        address: getContractAddress(),
        functionName: "registerWork",
        args: [metadataUri, priceWei, maxCopies],
      });
      dispatch({ type: "register_success", txHash: hash });
    } catch {
      dispatch({ type: "register_failed" });
    }
  }

  if (!canPublish) {
    return (
      <p className="text-sm text-white/70">
        Connect the author wallet ({authorAddress}) to publish a work.
      </p>
    );
  }

  return (
    <WorkPublishView
      values={state.values}
      errors={state.errors}
      step={isConfirming ? "registering" : state.step}
      coverImageName={state.coverImageName}
      metadataPreview={state.metadataPreview}
      txHash={state.txHash}
      errorMessage={state.errorMessage}
      onFieldChange={updateField}
      onCoverImageChange={(file) => {
        coverImageRef.current = file ?? null;
        dispatch({
          type: "cover_image_change",
          fileName: file?.name ?? null,
        });
      }}
      onUpload={() => {
        void handleUpload();
      }}
      onRegister={() => {
        void handleRegister();
      }}
    />
  );
}
