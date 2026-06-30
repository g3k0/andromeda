import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";

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
  metadataPreview: AcePublicMetadata | null;
  txHash: `0x${string}` | null;
  errorMessage: string | null;
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
  | { type: "upload_success"; metadata: AcePublicMetadata }
  | { type: "set_error_message"; message: string | null }
  | { type: "register_success"; txHash: `0x${string}` }
  | { type: "register_failed" };

export function createWorkPublishClientState(): WorkPublishClientState {
  return {
    values: createEmptyWorkPublishForm(),
    errors: {},
    step: "idle",
    coverImageName: null,
    manuscriptFileName: null,
    metadataPreview: null,
    txHash: null,
    errorMessage: null,
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
      };
    }
    case "cover_image_change": {
      const nextErrors = { ...state.errors };
      delete nextErrors.coverImage;
      return {
        ...state,
        coverImageName: action.fileName,
        errors: nextErrors,
      };
    }
    case "manuscript_file_change": {
      const nextErrors = { ...state.errors };
      delete nextErrors.manuscriptFile;
      return {
        ...state,
        manuscriptFileName: action.fileName,
        errors: nextErrors,
      };
    }
    case "set_errors":
      return { ...state, errors: action.errors };
    case "set_step":
      return { ...state, step: action.step };
    case "upload_success":
      return {
        ...state,
        metadataPreview: action.metadata,
        step: "ready",
        errorMessage: null,
      };
    case "set_error_message":
      return { ...state, errorMessage: action.message };
    case "register_success":
      return {
        ...state,
        txHash: action.txHash,
        step: "success",
        errorMessage: null,
      };
    case "register_failed":
      return {
        ...state,
        step: "ready",
        errorMessage: "On-chain registration failed.",
      };
    default:
      return state;
  }
}
