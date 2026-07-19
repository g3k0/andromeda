"use client";

import { useEffect, useReducer, useRef } from "react";
import {
  useAccount,
  useSignMessage,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";

import {
  createWorkPublishClientState,
  workPublishClientReducer,
} from "@/lib/works/work-publish-client-state";
import { useTranslation } from "@/lib/i18n/use-translation";
import { resolveWorkPublishUiStep } from "@/lib/works/work-publish-ui-step";
import { useWorkPublishActions } from "./use-work-publish-actions";
import { useWorkPublishEditionLabeling } from "./use-work-publish-edition-labeling";
import { useWorkPublishPendingEnvelopes } from "./use-work-publish-pending-envelopes";
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
  const { t } = useTranslation();

  const [state, dispatch] = useReducer(
    workPublishClientReducer,
    undefined,
    createWorkPublishClientState,
  );
  const coverImageRef = useRef<File | null>(null);
  const manuscriptFileRef = useRef<File | null>(null);
  const metadataUriRef = useRef<string | null>(null);

  const { data: receipt, isLoading: isConfirming } =
    useWaitForTransactionReceipt({
      hash: state.txHash ?? undefined,
    });

  const canPublish =
    isConnected && address?.toLowerCase() === authorAddress.toLowerCase();

  useWorkPublishPendingEnvelopes({
    canPublish,
    authorAddress,
    address,
    signMessageAsync,
  });

  useWorkPublishEditionLabeling({
    step: state.step,
    values: state.values,
    metadataPreview: state.metadataPreview,
    receipt,
    address,
    authorAddress,
    signMessageAsync,
    writeContractAsync,
    dispatch,
    t,
  });

  useEffect(() => {
    const url = state.editionPreview?.coverImageUrl;
    if (!url?.startsWith("blob:")) {
      return;
    }

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [state.editionPreview?.coverImageUrl]);

  const { updateField, handlePreviewEdition, handleUpload, handleRegister } =
    useWorkPublishActions({
      state,
      dispatch,
      refs: {
        coverImageRef,
        manuscriptFileRef,
        metadataUriRef,
      },
      canPublish,
      address,
      authorAddress,
      authorDisplayName,
      signMessageAsync,
      writeContractAsync,
      t,
    });

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
