"use client";

import { useEffect, useRef } from "react";
import type { TransactionReceipt } from "viem";

import { createSignedWalletPayload } from "@/lib/auth/client-wallet-auth";
import { andromedaWorksAbi } from "@/lib/chain/contract";
import { getContractAddress } from "@/lib/config/public-env";
import type { AcePublicMetadata } from "@/lib/ipfs/metadata-schema";
import { translateClientError } from "@/lib/i18n/api-error-messages";
import type { TranslateFn } from "@/lib/i18n/use-translation";
import {
  parseRegisterWorkParams,
  type WorkPublishFormValues,
  type WorkPublishStep,
} from "@/lib/works/work-publish-form-state";
import type { WorkPublishClientAction } from "@/lib/works/work-publish-client-state";
import { completeEditionMetadataAfterRegister } from "@/lib/works/work-publish-edition-metadata";

type UseWorkPublishEditionLabelingInput = {
  step: WorkPublishStep;
  values: WorkPublishFormValues;
  metadataPreview: AcePublicMetadata | null;
  receipt: TransactionReceipt | undefined;
  address: `0x${string}` | undefined;
  authorAddress: string;
  signMessageAsync: (args: { message: string }) => Promise<`0x${string}`>;
  writeContractAsync: ReturnType<
    typeof import("wagmi").useWriteContract
  >["writeContractAsync"];
  dispatch: React.Dispatch<WorkPublishClientAction>;
  t: TranslateFn;
};

export function useWorkPublishEditionLabeling({
  step,
  values,
  metadataPreview,
  receipt,
  address,
  authorAddress,
  signMessageAsync,
  writeContractAsync,
  dispatch,
  t,
}: UseWorkPublishEditionLabelingInput): void {
  const handledRegisterReceiptRef = useRef<string | null>(null);

  useEffect(() => {
    if (step !== "registering" || !receipt || !address || !metadataPreview) {
      return;
    }
    if (handledRegisterReceiptRef.current === receipt.transactionHash) {
      return;
    }
    handledRegisterReceiptRef.current = receipt.transactionHash;

    async function labelEditionCopies() {
      try {
        dispatch({ type: "set_step", step: "labeling_copies" });
        const { maxCopies } = parseRegisterWorkParams(values);
        const walletAuth = await createSignedWalletPayload(
          address!,
          signMessageAsync,
        );

        await completeEditionMetadataAfterRegister({
          logs: receipt!.logs,
          authorAddress,
          workMetadata: metadataPreview!,
          maxCopies,
          walletAuth,
          contractAddress: getContractAddress(),
          abi: andromedaWorksAbi,
          writeContractAsync: (request) =>
            writeContractAsync({
              abi: request.abi,
              address: request.address,
              functionName: request.functionName,
              args: [...request.args],
            }),
        });

        dispatch({ type: "set_step", step: "success" });
      } catch (error) {
        dispatch({ type: "register_failed" });
        dispatch({
          type: "set_error_message",
          message: translateClientError(t, error),
        });
      }
    }

    void labelEditionCopies();
  }, [
    receipt,
    step,
    metadataPreview,
    values,
    address,
    authorAddress,
    signMessageAsync,
    writeContractAsync,
    dispatch,
    t,
  ]);
}
