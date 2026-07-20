"use client";

import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";
import { useTranslation } from "@/lib/i18n/use-translation";
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
  editionPreviewAcknowledged: boolean;
  metadataPreview: AcePublicMetadata | null;
  txHash: `0x${string}` | null;
  errorMessage: string | null;
  statusMessage: string | null;
  onFieldChange: (field: keyof WorkPublishFormValues, value: string) => void;
  onCoverImageChange: (file: File | undefined) => void;
  onManuscriptFileChange: (file: File | undefined) => void;
  onPreviewEdition: () => void;
  onEditionPreviewAcknowledgedChange: (acknowledged: boolean) => void;
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
  editionPreviewAcknowledged,
  metadataPreview,
  txHash,
  errorMessage,
  statusMessage,
  onFieldChange,
  onCoverImageChange,
  onManuscriptFileChange,
  onPreviewEdition,
  onEditionPreviewAcknowledgedChange,
  onUpload,
  onRegister,
}: WorkPublishViewProps) {
  const { t } = useTranslation();
  const isBusy =
    step === "encrypting" ||
    step === "uploading" ||
    step === "registering" ||
    step === "labeling_copies";
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
            <h2 className="text-sm font-medium text-white">{t("publish.preview.sectionTitle")}</h2>
            <p className="mt-1 text-xs text-white/50">
              {t("publish.preview.sectionDescription")}
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
        editionPreviewAcknowledged={editionPreviewAcknowledged}
        metadataPreview={metadataPreview}
        txHash={txHash}
        errorMessage={errorMessage}
        statusMessage={statusMessage}
        isBusy={isBusy}
        isComplete={isComplete}
        onFieldChange={onFieldChange}
        onPreviewEdition={onPreviewEdition}
        onEditionPreviewAcknowledgedChange={onEditionPreviewAcknowledgedChange}
        onUpload={onUpload}
        onRegister={onRegister}
      />
    </form>
  );
}
