"use client";

import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { FormFieldLabel } from "@/components/form/FormFieldLabel";
import {
  formErrorClassName,
  formFileInputClassName,
  formTextInputClassName,
} from "@/components/form/form-field-styles";
import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";
import { WORK_MANUSCRIPT_UPLOAD_ACCEPT } from "@/lib/works/manuscript-upload-guidance";
import { WORK_PUBLISH_FORM_GUIDANCE } from "@/lib/works/work-publish-form-guidance";
import type {
  WorkPublishFormErrors,
  WorkPublishFormValues,
  WorkPublishStep,
} from "@/lib/works/work-publish-form-state";
import { formatMetadataPreview } from "@/lib/works/work-publish-form-state";
import { ALLOWED_WORK_COVER_MIME_TYPES } from "@/lib/works/upload-limits";
import {
  WORK_PUBLISH_DESCRIPTION_MAX_LENGTH,
  WORK_PUBLISH_NAME_MAX_LENGTH,
} from "@/lib/works/work-publish-field-validation";

export type WorkPublishViewProps = {
  values: WorkPublishFormValues;
  errors: WorkPublishFormErrors;
  step: WorkPublishStep;
  coverImageName: string | null;
  manuscriptFileName: string | null;
  metadataPreview: AcePublicMetadata | null;
  txHash: `0x${string}` | null;
  errorMessage: string | null;
  onFieldChange: (field: keyof WorkPublishFormValues, value: string) => void;
  onCoverImageChange: (file: File | undefined) => void;
  onManuscriptFileChange: (file: File | undefined) => void;
  onUpload: () => void;
  onRegister: () => void;
};

function fieldDescribedBy(
  error: string | undefined,
  errorId: string,
  hintId?: string,
): string | undefined {
  if (error) {
    return hintId ? `${errorId} ${hintId}` : errorId;
  }
  return hintId;
}

export function WorkPublishView({
  values,
  errors,
  step,
  coverImageName,
  manuscriptFileName,
  metadataPreview,
  txHash,
  errorMessage,
  onFieldChange,
  onCoverImageChange,
  onManuscriptFileChange,
  onUpload,
  onRegister,
}: WorkPublishViewProps) {
  const isBusy = step === "encrypting" || step === "uploading" || step === "registering";
  const isComplete = step === "success";

  return (
    <form
      noValidate
      className="flex w-full max-w-2xl flex-col gap-4"
      aria-labelledby="publish-work-title"
    >
      <div>
        <h1 id="publish-work-title" className="text-2xl font-semibold text-white">
          Publish a work
        </h1>
        <p className="mt-1 text-sm text-white/60">{WORK_PUBLISH_FORM_GUIDANCE.intro}</p>
        <p className="mt-2 text-xs text-white/50">
          Fields marked with <span className="text-red-400">*</span> are required.
        </p>
      </div>

      <div className="space-y-1">
        <FormFieldLabel
          htmlFor="publish-work-title-input"
          label="Title"
          required
          tooltipId="publish-work-title-tooltip"
          tooltip={WORK_PUBLISH_FORM_GUIDANCE.title}
        />
        <input
          id="publish-work-title-input"
          name="name"
          type="text"
          value={values.name}
          maxLength={WORK_PUBLISH_NAME_MAX_LENGTH}
          disabled={isBusy || isComplete}
          aria-required="true"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={fieldDescribedBy(errors.name, "publish-work-title-error")}
          onChange={(event) => onFieldChange("name", event.target.value)}
          className={formTextInputClassName}
        />
        {errors.name ? (
          <p id="publish-work-title-error" className={formErrorClassName} role="alert">
            {errors.name}
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <FormFieldLabel
          htmlFor="publish-work-description"
          label="Description"
          required
          tooltipId="publish-work-description-tooltip"
          tooltip={WORK_PUBLISH_FORM_GUIDANCE.description}
        />
        <textarea
          id="publish-work-description"
          name="description"
          value={values.description}
          maxLength={WORK_PUBLISH_DESCRIPTION_MAX_LENGTH}
          disabled={isBusy || isComplete}
          rows={3}
          aria-required="true"
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={fieldDescribedBy(
            errors.description,
            "publish-work-description-error",
          )}
          onChange={(event) => onFieldChange("description", event.target.value)}
          className={formTextInputClassName}
        />
        {errors.description ? (
          <p
            id="publish-work-description-error"
            className={formErrorClassName}
            role="alert"
          >
            {errors.description}
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <FormFieldLabel
          htmlFor="publish-work-manuscript"
          label="Manuscript file"
          required
          tooltipId="publish-work-manuscript-tooltip"
          tooltip={WORK_PUBLISH_FORM_GUIDANCE.manuscript}
        />
        <input
          id="publish-work-manuscript"
          name="manuscriptFile"
          type="file"
          accept={WORK_MANUSCRIPT_UPLOAD_ACCEPT}
          disabled={isBusy || isComplete}
          aria-required="true"
          aria-invalid={errors.manuscriptFile ? true : undefined}
          aria-describedby={fieldDescribedBy(
            errors.manuscriptFile,
            "publish-work-manuscript-error",
            manuscriptFileName ? "publish-work-manuscript-selected" : undefined,
          )}
          onChange={(event) => onManuscriptFileChange(event.target.files?.[0])}
          className={formFileInputClassName}
        />
        {manuscriptFileName ? (
          <p id="publish-work-manuscript-selected" className="text-xs text-white/50">
            Selected: {manuscriptFileName}
          </p>
        ) : null}
        {errors.manuscriptFile ? (
          <p
            id="publish-work-manuscript-error"
            className={formErrorClassName}
            role="alert"
          >
            {errors.manuscriptFile}
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <FormFieldLabel
          htmlFor="publish-work-cover"
          label="Cover image"
          required
          tooltipId="publish-work-cover-tooltip"
          tooltip={WORK_PUBLISH_FORM_GUIDANCE.cover}
        />
        <input
          id="publish-work-cover"
          name="coverImage"
          type="file"
          accept={ALLOWED_WORK_COVER_MIME_TYPES.join(",")}
          disabled={isBusy || isComplete}
          aria-required="true"
          aria-invalid={errors.coverImage ? true : undefined}
          aria-describedby={fieldDescribedBy(
            errors.coverImage,
            "publish-work-cover-error",
            coverImageName ? "publish-work-cover-selected" : undefined,
          )}
          onChange={(event) => onCoverImageChange(event.target.files?.[0])}
          className={formFileInputClassName}
        />
        {coverImageName ? (
          <p id="publish-work-cover-selected" className="text-xs text-white/50">
            Selected: {coverImageName}
          </p>
        ) : null}
        {errors.coverImage ? (
          <p id="publish-work-cover-error" className={formErrorClassName} role="alert">
            {errors.coverImage}
          </p>
        ) : null}
      </div>

      <fieldset
        disabled={isBusy || isComplete}
        className="space-y-4 rounded-lg border border-white/10 p-4"
      >
        <legend className="px-1 text-sm font-medium text-white">Pricing & editions</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <FormFieldLabel
              htmlFor="publish-work-price"
              label="Initial list price (MATIC)"
              tooltipId="publish-work-price-tooltip"
              tooltip={WORK_PUBLISH_FORM_GUIDANCE.initialPrice}
            />
            <input
              id="publish-work-price"
              name="priceMatic"
              type="text"
              inputMode="decimal"
              value={values.priceMatic}
              placeholder="Leave blank for no initial price"
              aria-invalid={errors.priceMatic ? true : undefined}
              aria-describedby={fieldDescribedBy(
                errors.priceMatic,
                "publish-work-price-error",
              )}
              onChange={(event) => onFieldChange("priceMatic", event.target.value)}
              className={formTextInputClassName}
            />
            {errors.priceMatic ? (
              <p id="publish-work-price-error" className={formErrorClassName} role="alert">
                {errors.priceMatic}
              </p>
            ) : null}
          </div>

          <div className="space-y-1">
            <FormFieldLabel
              htmlFor="publish-work-max-copies"
              label="Max copies"
              tooltipId="publish-work-max-copies-tooltip"
              tooltip={WORK_PUBLISH_FORM_GUIDANCE.maxCopies}
            />
            <input
              id="publish-work-max-copies"
              name="maxCopies"
              type="number"
              min={0}
              value={values.maxCopies}
              aria-invalid={errors.maxCopies ? true : undefined}
              aria-describedby={fieldDescribedBy(
                errors.maxCopies,
                "publish-work-max-copies-error",
              )}
              onChange={(event) => onFieldChange("maxCopies", event.target.value)}
              className={formTextInputClassName}
            />
            {errors.maxCopies ? (
              <p
                id="publish-work-max-copies-error"
                className={formErrorClassName}
                role="alert"
              >
                {errors.maxCopies}
              </p>
            ) : null}
          </div>
        </div>
      </fieldset>

      <div className="space-y-1">
        <FormFieldLabel
          htmlFor="publish-work-external-url"
          label="External URL"
          tooltipId="publish-work-external-url-tooltip"
          tooltip={WORK_PUBLISH_FORM_GUIDANCE.externalUrl}
        />
        <input
          id="publish-work-external-url"
          name="externalUrl"
          type="url"
          value={values.externalUrl}
          aria-invalid={errors.externalUrl ? true : undefined}
          aria-describedby={fieldDescribedBy(
            errors.externalUrl,
            "publish-work-external-url-error",
          )}
          onChange={(event) => onFieldChange("externalUrl", event.target.value)}
          className={formTextInputClassName}
        />
        {errors.externalUrl ? (
          <p
            id="publish-work-external-url-error"
            className={formErrorClassName}
            role="alert"
          >
            {errors.externalUrl}
          </p>
        ) : null}
      </div>

      {metadataPreview ? (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-white">ACE metadata preview</h2>
          <pre className="max-h-64 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-white/80">
            {formatMetadataPreview(metadataPreview)}
          </pre>
        </div>
      ) : null}

      {errorMessage ? (
        <p className={formErrorClassName} role="alert">
          {errorMessage}
        </p>
      ) : null}

      {step === "success" && txHash ? (
        <p className="text-sm text-emerald-400">
          Work registered on-chain. Transaction: {txHash}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        {step === "ready" || step === "registering" || step === "success" ? (
          <button
            type="button"
            disabled={isBusy || isComplete}
            onClick={onRegister}
            className="inline-flex items-center gap-2 rounded-lg bg-andromeda px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {step === "registering" ? <LoadingSpinner size="sm" /> : null}
            Register on-chain
          </button>
        ) : (
          <button
            type="button"
            disabled={isBusy}
            onClick={onUpload}
            className="inline-flex items-center gap-2 rounded-lg bg-andromeda px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {step === "encrypting" || step === "uploading" ? (
              <LoadingSpinner size="sm" />
            ) : null}
            {step === "encrypting"
              ? "Encrypting…"
              : step === "uploading"
                ? "Pinning to IPFS…"
                : "Upload to IPFS"}
          </button>
        )}
      </div>
    </form>
  );
}
