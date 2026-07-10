"use client";

import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { FormTextControl } from "@/components/form/FormTextControl";
import { formErrorClassName } from "@/components/form/form-field-styles";
import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";
import { getPublishExternalUrlGuidance } from "@/lib/i18n/publish-messages";
import { useTranslation } from "@/lib/i18n/use-translation";
import { WORK_PUBLISH_FORM_GUIDANCE } from "@/lib/works/work-publish-form-guidance";
import type {
  WorkPublishFormErrors,
  WorkPublishFormValues,
  WorkPublishStep,
} from "@/lib/works/work-publish-form-state";
import { formatMetadataPreview } from "@/lib/works/work-publish-form-state";

export type WorkPublishFormFooterProps = {
  values: WorkPublishFormValues;
  errors: WorkPublishFormErrors;
  step: WorkPublishStep;
  editionPreviewReady: boolean;
  editionPreviewAcknowledged: boolean;
  metadataPreview: AcePublicMetadata | null;
  txHash: `0x${string}` | null;
  errorMessage: string | null;
  isBusy: boolean;
  isComplete: boolean;
  onFieldChange: (field: keyof WorkPublishFormValues, value: string) => void;
  onPreviewEdition: () => void;
  onEditionPreviewAcknowledgedChange: (acknowledged: boolean) => void;
  onUpload: () => void;
  onRegister: () => void;
};

export function WorkPublishFormFooter({
  values,
  errors,
  step,
  editionPreviewReady,
  editionPreviewAcknowledged,
  metadataPreview,
  txHash,
  errorMessage,
  isBusy,
  isComplete,
  onFieldChange,
  onPreviewEdition,
  onEditionPreviewAcknowledgedChange,
  onUpload,
  onRegister,
}: WorkPublishFormFooterProps) {
  const { t } = useTranslation();
  const canUpload =
    editionPreviewReady &&
    editionPreviewAcknowledged &&
    !isBusy &&
    !isComplete;

  const uploadDisabledReason = !editionPreviewReady
    ? WORK_PUBLISH_FORM_GUIDANCE.previewBeforeUpload
    : !editionPreviewAcknowledged
      ? WORK_PUBLISH_FORM_GUIDANCE.editionPreviewAcknowledgment
      : undefined;

  return (
    <>
      <FormTextControl
        id="publish-work-external-url"
        name="externalUrl"
        label={t("publish.fields.externalUrl.label")}
        tooltipId="publish-work-external-url-tooltip"
        tooltip={getPublishExternalUrlGuidance(t)}
        error={errors.externalUrl}
        type="url"
        value={values.externalUrl}
        onChange={(event) => onFieldChange("externalUrl", event.target.value)}
      />

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

      {editionPreviewReady && step !== "ready" && step !== "registering" && step !== "success" ? (
        <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/85">
          <input
            id="publish-work-edition-preview-acknowledgment"
            name="editionPreviewAcknowledged"
            type="checkbox"
            required
            checked={editionPreviewAcknowledged}
            disabled={isBusy}
            onChange={(event) =>
              onEditionPreviewAcknowledgedChange(event.target.checked)
            }
            className="mt-0.5 size-4 shrink-0 accent-andromeda"
          />
          <span>
            {WORK_PUBLISH_FORM_GUIDANCE.editionPreviewAcknowledgment}
            <span className="text-red-400"> *</span>
          </span>
        </label>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
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
          <>
            <button
              type="button"
              disabled={isBusy}
              onClick={onPreviewEdition}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Preview edition
            </button>
            <button
              type="button"
              disabled={!canUpload}
              onClick={onUpload}
              title={uploadDisabledReason}
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
          </>
        )}
      </div>

      {!editionPreviewReady && step !== "ready" && step !== "registering" && step !== "success" ? (
        <p className="text-xs text-white/50">{WORK_PUBLISH_FORM_GUIDANCE.previewBeforeUpload}</p>
      ) : null}
    </>
  );
}
