"use client";

import { useEffect, useReducer, useRef } from "react";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { andromedaWorksAbi } from "@/lib/chain/contract";
import type { WorkOnChain } from "@/lib/chain/types";
import { getContractAddress } from "@/lib/config/public-env";
import {
  buildCreateAccountTransaction,
  resolveTbaAddress,
} from "@/lib/tba/tba-operations";
import {
  getErc6551RegistryConfig,
  getTargetChainId,
} from "@/lib/tba/tba-registry";
import {
  createMintCopyClientState,
  mintCopyClientReducer,
} from "@/lib/works/mint-copy-client-state";
import {
  formatWorkPrice,
  getWorkAvailability,
} from "@/lib/works/mint-copy-tx";
import { extractMintedTokenId } from "@/lib/works/mint-receipt";
import { useTranslation } from "@/lib/i18n/use-translation";

import { MintCopyView } from "./MintCopyView";

export type MintCopyClientProps = {
  work: WorkOnChain;
  title: string;
};

export function MintCopyClient({ work, title }: MintCopyClientProps) {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  const [state, dispatch] = useReducer(
    mintCopyClientReducer,
    undefined,
    createMintCopyClientState,
  );
  const handledReceiptRef = useRef<string | null>(null);

  const { data: receipt } = useWaitForTransactionReceipt({
    hash: state.txHash ?? undefined,
  });

  const availability = getWorkAvailability(work);
  const workId = work.workId;

  useEffect(() => {
    if (state.step !== "minting" || !receipt || !address) {
      return;
    }
    if (handledReceiptRef.current === receipt.transactionHash) {
      return;
    }
    handledReceiptRef.current = receipt.transactionHash;

    async function setupTokenAccount() {
      try {
        const tokenId = extractMintedTokenId(receipt!.logs, {
          workId,
          buyer: address,
        });
        dispatch({
          type: "mint_confirmed",
          txHash: receipt!.transactionHash,
          tokenId,
        });

        const config = getErc6551RegistryConfig(getTargetChainId());
        const lookup = {
          chainId: config.chainId,
          tokenContract: getContractAddress(),
          tokenId,
        };
        const tbaAddress = resolveTbaAddress(config, lookup);
        dispatch({ type: "tba_deploying", address: tbaAddress });

        const deployTx = buildCreateAccountTransaction(config, lookup);
        await sendTransactionAsync({
          to: deployTx.to,
          data: deployTx.data,
          value: deployTx.value,
        });

        dispatch({ type: "mint_completed" });
      } catch (error) {
        dispatch({
          type: "mint_failed",
          message:
            error instanceof Error
              ? error.message
              : t("mint.mintFailed"),
        });
      }
    }

    void setupTokenAccount();
  }, [receipt, state.step, address, workId, sendTransactionAsync, t]);

  async function handleMint() {
    if (!isConnected || !address) {
      dispatch({ type: "mint_failed", message: t("mint.connectWallet") });
      return;
    }
    if (!availability.saleOpen) {
      dispatch({ type: "mint_failed", message: t("mint.notAvailable") });
      return;
    }

    dispatch({ type: "mint_started" });

    try {
      const hash = await writeContractAsync({
        abi: andromedaWorksAbi,
        address: getContractAddress(),
        functionName: "mintCopy",
        args: [workId],
        value: work.price,
      });
      dispatch({ type: "mint_submitted", txHash: hash });
    } catch (error) {
      dispatch({
        type: "mint_failed",
        message:
          error instanceof Error ? error.message : t("mint.txFailed"),
      });
    }
  }

  return (
    <MintCopyView
      title={title}
      priceLabel={formatWorkPrice(work.price)}
      availability={availability}
      step={state.step}
      tokenId={state.tokenId}
      txHash={state.txHash}
      tbaAddress={state.tbaAddress}
      errorMessage={state.errorMessage}
      canMint={isConnected && Boolean(address)}
      onMint={() => {
        void handleMint();
      }}
    />
  );
}
