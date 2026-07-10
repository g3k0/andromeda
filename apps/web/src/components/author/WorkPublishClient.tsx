"use client";

import { useEffect, useReducer, useRef } from "react";
import { useAccount, useSignMessage, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { createSignedWalletPayload } from "@/lib/auth/client-wallet-auth";
import { andromedaWorksAbi } from "@/lib/chain/contract";
import { getContractAddress } from "@/lib/config/public-env";
import { storeWorkContentKey } from "@/lib/works/content-key-session";
import { buildWorkPublishEditionPreview } from "@/lib/works/work-publish-preview";
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
import { useTranslation } from "@/lib/i18n/use-translation";
import { WorkPublishView } from "./WorkPublishView";

export type WorkPublishClientProps = {
  authorAddress: string;
  authorDisplayName?: string | null;
};

export function WorkPublishClient({
  authorAddress,
  authorDisplayName,
}: WorkPublishClientProps) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();
  const { runWithLoading } = useLoading();
  const { t } = useTranslation();

  const [state, dispatch] = useReducer(
    workPublishClientReducer,
    undefined,
    createWorkPublishClientState,
  );
  const coverImageRef = useRef<File | null>(null);
  const manuscriptFileRef = useRef<File | null>(null);
  const metadataUriRef = useRef<string | null>(null);

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: state.txHash ?? undefined,
  });

  const canPublish =
    isConnected &&
    address?.toLowerCase() === authorAddress.toLowerCase();

  useEffect(() => {
    const url = state.editionPreview?.coverImageUrl;
    if (!url?.startsWith("blob:")) {
      return;
    }

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [state.editionPreview?.coverImageUrl]);

  function updateField(field: keyof WorkPublishFormValues, value: string) {
    dispatch({ type: "field_change", field, value });
  }

  async function handlePreviewEdition() {
    const coverImage = coverImageRef.current;
    const manuscriptFile = manuscriptFileRef.current;

    if (!canPublish || !coverImage || !manuscriptFile) {
      dispatch({
        type: "set_error_message",
        message: "Connect the author wallet and attach cover and manuscript files.",
      });
      return;
    }

    const nextErrors = validateWorkPublishForm(
      state.values,
      coverImage,
      manuscriptFile,
      t,
    );
    dispatch({ type: "set_errors", errors: nextErrors });
    if (hasWorkPublishFormErrors(nextErrors)) {
      return;
    }

    dispatch({ type: "set_error_message", message: null });

    try {
      const coverImageUrl = URL.createObjectURL(coverImage);

      const preview = await buildWorkPublishEditionPreview({
        values: state.values,
        authorAddress,
        authorDisplayName,
        coverImage,
        manuscriptFile,
        coverImageUrl,
      });

      dispatch({ type: "edition_preview_ready", preview });
    } catch (error) {
      dispatch({
        type: "set_error_message",
        message:
          error instanceof Error ? error.message : "Edition preview failed.",
      });
    }
  }

  async function handleUpload() {
    const coverImage = coverImageRef.current;
    const manuscriptFile = manuscriptFileRef.current;

    if (!canPublish || !coverImage || !manuscriptFile) {
      dispatch({
        type: "set_error_message",
        message: "Connect the author wallet to publish.",
      });
      return;
    }

    if (!state.editionPreviewReady) {
      dispatch({
        type: "set_error_message",
        message: "Preview the edition before uploading to IPFS.",
      });
      return;
    }

    if (!state.editionPreviewAcknowledged) {
      dispatch({
        type: "set_error_message",
        message:
          "Confirm that you reviewed the edition preview and accept on-chain immutability.",
      });
      return;
    }

    const nextErrors = validateWorkPublishForm(
      state.values,
      coverImage,
      manuscriptFile,
      t,
    );
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
          authorAddress,
          coverImage,
          manuscriptFile,
          walletAuth,
        });

        metadataUriRef.current = result.metadataUri;
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
        {t("publish.errors.connectWalletToPublish", { authorAddress })}
      </p>
    );
  }

  return (
    <WorkPublishView
      values={state.values}
      errors={state.errors}
      authorAddress={authorAddress}
      step={isConfirming ? "registering" : state.step}
      coverImageName={state.coverImageName}
      manuscriptFileName={state.manuscriptFileName}
      editionPreview={state.editionPreview}
      editionPreviewReady={state.editionPreviewReady}
      editionPreviewAcknowledged={state.editionPreviewAcknowledged}
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
      onManuscriptFileChange={(file) => {
        manuscriptFileRef.current = file ?? null;
        dispatch({
          type: "manuscript_file_change",
          fileName: file?.name ?? null,
        });
      }}
      onPreviewEdition={() => {
        void handlePreviewEdition();
      }}
      onEditionPreviewAcknowledgedChange={(acknowledged) => {
        dispatch({ type: "edition_preview_acknowledged_change", acknowledged });
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
