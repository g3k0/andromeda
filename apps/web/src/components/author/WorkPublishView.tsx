"use client";

import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";
import type {
  WorkPublishFormErrors,
  WorkPublishFormValues,
  WorkPublishStep,
} from "@/lib/works/work-publish-form-state";

import { WorkPublishFormFooter } from "./WorkPublishFormFooter";
import { WorkPublishFormHeader } from "./WorkPublishFormHeader";
import { WorkPublishMetadataFields } from "./WorkPublishMetadataFields";
import { WorkPublishPricingSection } from "./WorkPublishPricingSection";
import { WorkPublishBookPreview } from "./WorkPublishBookPreview";
import type { WorkPublishEditionPreview } from "@/lib/works/work-publish-preview";

export type WorkPublishViewProps = {
  values: WorkPublishFormValues;
  errors: WorkPublishFormErrors;
  authorAddress: string;
  step: WorkPublishStep;
  coverImageName: string | null;
  manuscriptFileName: string | null;
  editionPreview: WorkPublishEditionPreview | null;
  editionPreviewReady: boolean;
  metadataPreview: AcePublicMetadata | null;
  txHash: `0x${string}` | null;
  errorMessage: string | null;
  onFieldChange: (field: keyof WorkPublishFormValues, value: string) => void;
  onCoverImageChange: (file: File | undefined) => void;
  onManuscriptFileChange: (file: File | undefined) => void;
  onPreviewEdition: () => void;
  onUpload: () => void;
  onRegister: () => void;
};

export function WorkPublishView({
  values,
  errors,
  authorAddress,
  step,
  coverImageName,
  manuscriptFileName,
  editionPreview,
  editionPreviewReady,
  metadataPreview,
  txHash,
  errorMessage,
  onFieldChange,
  onCoverImageChange,
  onManuscriptFileChange,
  onPreviewEdition,
  onUpload,
  onRegister,
}: WorkPublishViewProps) {
  const isBusy = step === "encrypting" || step === "uploading" || step === "registering";
  const isComplete = step === "success";
  const disabled = isBusy || isComplete;

  return (
    <form
      noValidate
      className="flex w-full max-w-2xl flex-col gap-4"
      aria-labelledby="publish-work-title"
    >
      <WorkPublishFormHeader />

      <WorkPublishMetadataFields
        values={values}
        errors={errors}
        authorAddress={authorAddress}
        disabled={disabled}
        coverImageName={coverImageName}
        manuscriptFileName={manuscriptFileName}
        onFieldChange={onFieldChange}
        onCoverImageChange={onCoverImageChange}
        onManuscriptFileChange={onManuscriptFileChange}
      />

      <WorkPublishPricingSection
        values={values}
        errors={errors}
        disabled={disabled}
        onFieldChange={onFieldChange}
      />

      {editionPreview ? (
        <div className="space-y-3">
          <div>
            <h2 className="text-sm font-medium text-white">Edition preview</h2>
            <p className="mt-1 text-xs text-white/50">
              Review the formatted edition before pinning it to IPFS.
            </p>
          </div>
          <WorkPublishBookPreview preview={editionPreview} />
        </div>
      ) : null}

      <WorkPublishFormFooter
        values={values}
        errors={errors}
        step={step}
        editionPreviewReady={editionPreviewReady}
        metadataPreview={metadataPreview}
        txHash={txHash}
        errorMessage={errorMessage}
        isBusy={isBusy}
        isComplete={isComplete}
        onFieldChange={onFieldChange}
        onPreviewEdition={onPreviewEdition}
        onUpload={onUpload}
        onRegister={onRegister}
      />
    </form>
  );
}
