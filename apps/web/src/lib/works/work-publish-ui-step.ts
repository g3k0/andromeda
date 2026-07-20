import type { WorkPublishStep } from "./work-publish-form-state";

/** Keeps the success UI visible once the tx hash is known, even while the receipt polls. */
export function resolveWorkPublishUiStep(
  stateStep: WorkPublishStep,
  isConfirmingReceipt: boolean,
): WorkPublishStep {
  if (stateStep === "success" || stateStep === "labeling_copies") {
    return stateStep;
  }

  if (stateStep === "registering" && isConfirmingReceipt) {
    return "registering";
  }

  return stateStep;
}
