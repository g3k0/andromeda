"use client";

import type { Dispatch, MutableRefObject } from "react";

import { createSignedWalletPayload } from "@/lib/auth/client-wallet-auth";
import { andromedaWorksAbi } from "@/lib/chain/contract";
import { getContractAddress } from "@/lib/config/public-env";
import { useLoading } from "@/components/loading/LoadingProvider";
import { translateClientError } from "@/lib/i18n/api-error-messages";
import type { TranslateFn } from "@/lib/i18n/use-translation";
import { storeWorkContentKey } from "@/lib/works/content-key-session";
import { buildWorkPublishEditionPreview } from "@/lib/works/work-publish-preview";
import { uploadWorkPublishPayload } from "@/lib/works/work-publish-client";
import type { WorkPublishClientAction, WorkPublishClientState } from "@/lib/works/work-publish-client-state";
import {
  hasWorkPublishFormErrors,
  parseRegisterWorkParams,
  validateWorkPublishForm,
  type WorkPublishFormValues,
} from "@/lib/works/work-publish-form-state";

export type WorkPublishFileRefs = {
  coverImageRef: MutableRefObject<File | null>;
  manuscriptFileRef: MutableRefObject<File | null>;
  metadataUriRef: MutableRefObject<string | null>;
};

type UseWorkPublishActionsInput = {
  state: WorkPublishClientState;
  dispatch: Dispatch<WorkPublishClientAction>;
  refs: WorkPublishFileRefs;
  canPublish: boolean;
  address: `0x${string}` | undefined;
  authorAddress: string;
  authorDisplayName?: string | null;
  signMessageAsync: (args: { message: string }) => Promise<`0x${string}`>;
  writeContractAsync: ReturnType<
    typeof import("wagmi").useWriteContract
  >["writeContractAsync"];
  t: TranslateFn;
};

export function useWorkPublishActions({
  state,
  dispatch,
  refs,
  canPublish,
  address,
  authorAddress,
  authorDisplayName,
  signMessageAsync,
  writeContractAsync,
  t,
}: UseWorkPublishActionsInput) {
  const { runWithLoading } = useLoading();

  function updateField(field: keyof WorkPublishFormValues, value: string) {
    dispatch({ type: "field_change", field, value });
  }

  async function handlePreviewEdition() {
    const coverImage = refs.coverImageRef.current;
    const manuscriptFile = refs.manuscriptFileRef.current;

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

      const preview = await buildWorkPublishEditionPreview(
        {
          values: state.values,
          authorAddress,
          authorDisplayName,
          coverImage,
          manuscriptFile,
          coverImageUrl,
        },
        t,
      );

      dispatch({ type: "edition_preview_ready", preview });
    } catch (error) {
      dispatch({
        type: "set_error_message",
        message: translateClientError(t, error),
      });
    }
  }

  async function handleUpload() {
    const coverImage = refs.coverImageRef.current;
    const manuscriptFile = refs.manuscriptFileRef.current;

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
          address!,
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

        refs.metadataUriRef.current = result.metadataUri;
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
    const metadataUri = refs.metadataUriRef.current;

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

  return {
    updateField,
    handlePreviewEdition,
    handleUpload,
    handleRegister,
  };
}
