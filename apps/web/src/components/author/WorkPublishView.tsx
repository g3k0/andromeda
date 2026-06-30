"use client";

import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";
import type {
  WorkPublishFormErrors,
  WorkPublishFormValues,
  WorkPublishStep,
} from "@/lib/works/work-publish-form-state";
import { formatMetadataPreview } from "@/lib/works/work-publish-form-state";
import {
  getWorkManuscriptUploadGuidance,
  WORK_MANUSCRIPT_UPLOAD_ACCEPT,
} from "@/lib/works/manuscript-upload-guidance";
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

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">Publish a work</h1>
        <p className="mt-1 text-sm text-white/60">
          Upload your manuscript file. It is encrypted in your browser before it
          reaches IPFS.
        </p>
      </div>

      <label className="space-y-1">
        <span className="text-sm text-white/60">Title</span>
        <input
          type="text"
          value={values.name}
          maxLength={WORK_PUBLISH_NAME_MAX_LENGTH}
          disabled={isBusy || step === "success"}
          onChange={(event) => onFieldChange("name", event.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-andromeda-light/50"
        />
        {errors.name ? <p className="text-xs text-red-400">{errors.name}</p> : null}
      </label>

      <label className="space-y-1">
        <span className="text-sm text-white/60">Description</span>
        <textarea
          value={values.description}
          maxLength={WORK_PUBLISH_DESCRIPTION_MAX_LENGTH}
          disabled={isBusy || step === "success"}
          rows={3}
          onChange={(event) => onFieldChange("description", event.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-andromeda-light/50"
        />
        {errors.description ? (
          <p className="text-xs text-red-400">{errors.description}</p>
        ) : null}
      </label>

      <label className="space-y-1">
        <span className="text-sm text-white/60">Manuscript file</span>
        <input
          type="file"
          accept={WORK_MANUSCRIPT_UPLOAD_ACCEPT}
          disabled={isBusy || step === "success"}
          onChange={(event) => onManuscriptFileChange(event.target.files?.[0])}
          className="w-full text-sm text-white/80 file:mr-3 file:rounded-md file:border-0 file:bg-andromeda file:px-3 file:py-2 file:text-sm file:text-white"
        />
        <p className="text-xs leading-relaxed text-white/50">
          {getWorkManuscriptUploadGuidance()}
        </p>
        {manuscriptFileName ? (
          <p className="text-xs text-white/50">Selected: {manuscriptFileName}</p>
        ) : null}
        {errors.manuscriptFile ? (
          <p className="text-xs text-red-400">{errors.manuscriptFile}</p>
        ) : null}
      </label>

      <label className="space-y-1">
        <span className="text-sm text-white/60">Cover image</span>
        <input
          type="file"
          accept={ALLOWED_WORK_COVER_MIME_TYPES.join(",")}
          disabled={isBusy || step === "success"}
          onChange={(event) => onCoverImageChange(event.target.files?.[0])}
          className="w-full text-sm text-white/80 file:mr-3 file:rounded-md file:border-0 file:bg-andromeda file:px-3 file:py-2 file:text-sm file:text-white"
        />
        {coverImageName ? (
          <p className="text-xs text-white/50">Selected: {coverImageName}</p>
        ) : null}
        {errors.coverImage ? (
          <p className="text-xs text-red-400">{errors.coverImage}</p>
        ) : null}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm text-white/60">Price (MATIC)</span>
          <input
            type="text"
            inputMode="decimal"
            value={values.priceMatic}
            disabled={isBusy || step === "success"}
            onChange={(event) => onFieldChange("priceMatic", event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-andromeda-light/50"
          />
          {errors.priceMatic ? (
            <p className="text-xs text-red-400">{errors.priceMatic}</p>
          ) : null}
        </label>

        <label className="space-y-1">
          <span className="text-sm text-white/60">Max copies (0 = unlimited)</span>
          <input
            type="number"
            min={0}
            value={values.maxCopies}
            disabled={isBusy || step === "success"}
            onChange={(event) => onFieldChange("maxCopies", event.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-andromeda-light/50"
          />
          {errors.maxCopies ? (
            <p className="text-xs text-red-400">{errors.maxCopies}</p>
          ) : null}
        </label>
      </div>

      <label className="space-y-1">
        <span className="text-sm text-white/60">External URL (optional)</span>
        <input
          type="url"
          value={values.externalUrl}
          disabled={isBusy || step === "success"}
          onChange={(event) => onFieldChange("externalUrl", event.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-andromeda-light/50"
        />
        {errors.externalUrl ? (
          <p className="text-xs text-red-400">{errors.externalUrl}</p>
        ) : null}
      </label>

      {metadataPreview ? (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-white">ACE metadata preview</h2>
          <pre className="max-h-64 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-white/80">
            {formatMetadataPreview(metadataPreview)}
          </pre>
        </div>
      ) : null}

      {errorMessage ? (
        <p className="text-sm text-red-400" role="alert">
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
            disabled={isBusy || step === "success"}
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
    </div>
  );
}
