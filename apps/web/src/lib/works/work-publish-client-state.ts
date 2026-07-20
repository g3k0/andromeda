import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";
import type { WorkPublishEditionPreview } from "@/lib/works/work-publish-preview";

import {
  createEmptyWorkPublishForm,
  type WorkPublishFormErrors,
  type WorkPublishFormValues,
  type WorkPublishStep,
} from "./work-publish-form-state";

export type WorkPublishClientState = {
  values: WorkPublishFormValues;
  errors: WorkPublishFormErrors;
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
};

export type WorkPublishClientAction =
  | {
      type: "field_change";
      field: keyof WorkPublishFormValues;
      value: string;
    }
  | { type: "cover_image_change"; fileName: string | null }
  | { type: "manuscript_file_change"; fileName: string | null }
  | { type: "set_errors"; errors: WorkPublishFormErrors }
  | { type: "set_step"; step: WorkPublishStep }
  | { type: "edition_preview_ready"; preview: WorkPublishEditionPreview }
  | { type: "edition_preview_acknowledged_change"; acknowledged: boolean }
  | { type: "clear_edition_preview" }
  | { type: "upload_success"; metadata: AcePublicMetadata }
  | { type: "set_error_message"; message: string | null }
  | { type: "set_status_message"; message: string | null }
  | { type: "register_success"; txHash: `0x${string}` }
  | { type: "register_failed" };

export function createWorkPublishClientState(): WorkPublishClientState {
  return {
    values: createEmptyWorkPublishForm(),
    errors: {},
    step: "idle",
    coverImageName: null,
    manuscriptFileName: null,
    editionPreview: null,
    editionPreviewReady: false,
    editionPreviewAcknowledged: false,
    metadataPreview: null,
    txHash: null,
    errorMessage: null,
    statusMessage: null,
  };
}

function clearEditionPreviewState(): Pick<
  WorkPublishClientState,
  "editionPreview" | "editionPreviewReady" | "editionPreviewAcknowledged"
> {
  return {
    editionPreview: null,
    editionPreviewReady: false,
    editionPreviewAcknowledged: false,
  };
}

export function workPublishClientReducer(
  state: WorkPublishClientState,
  action: WorkPublishClientAction,
): WorkPublishClientState {
  switch (action.type) {
    case "field_change": {
      const nextErrors = { ...state.errors };
      delete nextErrors[action.field];
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
        errors: nextErrors,
        ...clearEditionPreviewState(),
      };
    }
    case "cover_image_change": {
      const nextErrors = { ...state.errors };
      delete nextErrors.coverImage;
      return {
        ...state,
        coverImageName: action.fileName,
        errors: nextErrors,
        ...clearEditionPreviewState(),
      };
    }
    case "manuscript_file_change": {
      const nextErrors = { ...state.errors };
      delete nextErrors.manuscriptFile;
      return {
        ...state,
        manuscriptFileName: action.fileName,
        errors: nextErrors,
        ...clearEditionPreviewState(),
      };
    }
    case "set_errors":
      return { ...state, errors: action.errors };
    case "set_step":
      return { ...state, step: action.step };
    case "edition_preview_ready":
      return {
        ...state,
        editionPreview: action.preview,
        editionPreviewReady: true,
        editionPreviewAcknowledged: false,
        errorMessage: null,
        statusMessage: null,
      };
    case "edition_preview_acknowledged_change":
      return {
        ...state,
        editionPreviewAcknowledged: action.acknowledged,
      };
    case "clear_edition_preview":
      return {
        ...state,
        ...clearEditionPreviewState(),
      };
    case "upload_success":
      return {
        ...state,
        metadataPreview: action.metadata,
        step: "ready",
        errorMessage: null,
        statusMessage: null,
      };
    case "set_error_message":
      return { ...state, errorMessage: action.message };
    case "set_status_message":
      return { ...state, statusMessage: action.message };
    case "register_success":
      return {
        ...state,
        txHash: action.txHash,
        step: "registering",
        errorMessage: null,
        statusMessage: null,
      };
    case "register_failed":
      return {
        ...state,
        step: "ready",
        statusMessage: null,
      };
    default:
      return state;
  }
}
