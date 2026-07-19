"use client";

import { useEffect, useReducer, useRef } from "react";
import { useAccount, useSignMessage, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { createSignedWalletPayload } from "@/lib/auth/client-wallet-auth";
import { andromedaWorksAbi } from "@/lib/chain/contract";
import { getContractAddress } from "@/lib/config/public-env";
import { storeWorkContentKey } from "@/lib/works/content-key-session";
import { provisionAllPendingEnvelopesForAuthor } from "@/lib/works/mint-envelope-author-client";
import { completeEditionMetadataAfterRegister } from "@/lib/works/work-publish-edition-metadata";
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
import { translateClientError } from "@/lib/i18n/api-error-messages";
import { resolveWorkPublishUiStep } from "@/lib/works/work-publish-ui-step";
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
  const provisioningPendingEnvelopesRef = useRef(false);
  const handledRegisterReceiptRef = useRef<string | null>(null);

  const { data: receipt, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: state.txHash ?? undefined,
  });

  const canPublish =
    isConnected &&
    address?.toLowerCase() === authorAddress.toLowerCase();

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

  useEffect(() => {
    if (
      state.step !== "registering" ||
      !receipt ||
      !address ||
      !state.metadataPreview
    ) {
      return;
    }
    if (handledRegisterReceiptRef.current === receipt.transactionHash) {
      return;
    }
    handledRegisterReceiptRef.current = receipt.transactionHash;

    async function labelEditionCopies() {
      try {
        dispatch({ type: "set_step", step: "labeling_copies" });
        const { priceWei, maxCopies } = parseRegisterWorkParams(state.values);
        const walletAuth = await createSignedWalletPayload(
          address!,
          signMessageAsync,
        );

        await completeEditionMetadataAfterRegister({
          logs: receipt!.logs,
          authorAddress,
          workMetadata: state.metadataPreview!,
          maxCopies,
          walletAuth,
          contractAddress: getContractAddress(),
          abi: andromedaWorksAbi,
          writeContractAsync: (request) =>
            writeContractAsync({
              abi: request.abi,
              address: request.address,
              functionName: request.functionName,
              args: [...request.args],
            }),
        });

        dispatch({ type: "set_step", step: "success" });
      } catch (error) {
        dispatch({ type: "register_failed" });
        dispatch({
          type: "set_error_message",
          message: translateClientError(t, error),
        });
      }
    }

    void labelEditionCopies();
  }, [
    receipt,
    state.step,
    state.metadataPreview,
    state.values,
    address,
    authorAddress,
    signMessageAsync,
    writeContractAsync,
    t,
  ]);

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
        message: t("publish.errors.connectWalletAndFiles"),
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
      }, t);

      dispatch({ type: "edition_preview_ready", preview });
    } catch (error) {
      dispatch({
        type: "set_error_message",
        message: translateClientError(t, error),
      });
    }
  }

  async function handleUpload() {
    const coverImage = coverImageRef.current;
    const manuscriptFile = manuscriptFileRef.current;

    if (!canPublish || !coverImage || !manuscriptFile) {
      dispatch({
        type: "set_error_message",
        message: t("publish.errors.connectWalletToPublishShort"),
      });
      return;
    }

    if (!state.editionPreviewReady) {
      dispatch({
        type: "set_error_message",
        message: t("publish.errors.previewBeforeUpload"),
      });
      return;
    }

    if (!state.editionPreviewAcknowledged) {
      dispatch({
        type: "set_error_message",
        message: t("publish.errors.confirmImmutability"),
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
      }, t("publish.loading.uploading"));
    } catch (error) {
      dispatch({ type: "set_step", step: "error" });
      dispatch({
        type: "set_error_message",
        message: translateClientError(t, error),
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
        message: t("publish.errors.connectWalletToRegister"),
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
      dispatch({
        type: "set_error_message",
        message: t("publish.errors.registerFailed"),
      });
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
      step={resolveWorkPublishUiStep(state.step, isConfirming)}
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
