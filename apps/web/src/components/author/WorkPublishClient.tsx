"use client";

import { useState } from "react";
import { useAccount, useSignMessage, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { createSignedWalletPayload } from "@/lib/auth/client-wallet-auth";
import { andromedaWorksAbi } from "@/lib/chain/contract";
import { getContractAddress } from "@/lib/config/public-env";
import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";
import { storeWorkContentKey } from "@/lib/works/content-key-session";
import { uploadWorkPublishPayload } from "@/lib/works/work-publish-client";
import {
  createEmptyWorkPublishForm,
  hasWorkPublishFormErrors,
  parseRegisterWorkParams,
  validateWorkPublishForm,
  type WorkPublishFormErrors,
  type WorkPublishFormValues,
  type WorkPublishStep,
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

  const [values, setValues] = useState<WorkPublishFormValues>(
    createEmptyWorkPublishForm,
  );
  const [errors, setErrors] = useState<WorkPublishFormErrors>({});
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [step, setStep] = useState<WorkPublishStep>("idle");
  const [metadataPreview, setMetadataPreview] = useState<AcePublicMetadata | null>(
    null,
  );
  const [metadataUri, setMetadataUri] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash ?? undefined,
  });

  const canPublish =
    isConnected &&
    address?.toLowerCase() === authorAddress.toLowerCase();

  function updateField(field: keyof WorkPublishFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleUpload() {
    if (!canPublish || !coverImage) {
      setErrorMessage("Connect the author wallet to publish.");
      return;
    }

    const nextErrors = validateWorkPublishForm(values, coverImage);
    setErrors(nextErrors);
    if (hasWorkPublishFormErrors(nextErrors)) {
      return;
    }

    setErrorMessage(null);

    try {
      await runWithLoading(async () => {
        setStep("encrypting");
        const walletAuth = await createSignedWalletPayload(
          address,
          signMessageAsync,
        );

        setStep("uploading");
        const result = await uploadWorkPublishPayload({
          values,
          coverImage,
          walletAuth,
        });

        setMetadataPreview(result.metadata);
        setMetadataUri(result.metadataUri);
        // Content key stays in the browser for PR7 mint envelopes — never sent to the server.
        storeWorkContentKey(result.metadataUri, result.contentKey);
        setStep("ready");
      }, "Uploading encrypted work…");
    } catch (error) {
      setStep("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Work upload failed.",
      );
    }
  }

  async function handleRegister() {
    if (!metadataUri) {
      return;
    }

    if (!canPublish) {
      setErrorMessage("Connect the author wallet to register the work.");
      return;
    }

    setErrorMessage(null);
    setStep("registering");

    try {
      const { priceWei, maxCopies } = parseRegisterWorkParams(values);
      const hash = await writeContractAsync({
        abi: andromedaWorksAbi,
        address: getContractAddress(),
        functionName: "registerWork",
        args: [metadataUri, priceWei, maxCopies],
      });
      setTxHash(hash);
      setStep("success");
    } catch {
      setStep("ready");
      setErrorMessage("On-chain registration failed.");
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
      values={values}
      errors={errors}
      step={isConfirming ? "registering" : step}
      coverImageName={coverImage?.name ?? null}
      metadataPreview={metadataPreview}
      txHash={txHash}
      errorMessage={errorMessage}
      onFieldChange={updateField}
      onCoverImageChange={(file) => {
        setCoverImage(file ?? null);
        setErrors((current) => {
          const next = { ...current };
          delete next.coverImage;
          return next;
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
