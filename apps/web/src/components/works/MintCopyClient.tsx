"use client";

import { useEffect, useReducer, useRef } from "react";
import {
  useAccount,
  useSendTransaction,
  useSignMessage,
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
import { completeMintEnvelopeSetup } from "@/lib/works/mint-envelope-flow-client";
import { useTranslation } from "@/lib/i18n/use-translation";

import { MintCopyView } from "./MintCopyView";

const RECEIPT_WAIT_TIMEOUT_MS = 120_000;

export type MintCopyClientProps = {
  work: WorkOnChain;
  title: string;
};

export function MintCopyClient({ work, title }: MintCopyClientProps) {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();
  const { sendTransactionAsync } = useSendTransaction();

  const [state, dispatch] = useReducer(
    mintCopyClientReducer,
    undefined,
    createMintCopyClientState,
  );
  const handledReceiptRef = useRef<string | null>(null);

  const { data: receipt, isError: isReceiptError } = useWaitForTransactionReceipt({
    hash: state.txHash ?? undefined,
  });

  const availability = getWorkAvailability(work);
  const workId = work.workId;

  useEffect(() => {
    if (state.step !== "minting" || !state.txHash) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dispatch({
        type: "mint_failed",
        message: t("mint.receiptTimeout"),
      });
    }, RECEIPT_WAIT_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [state.step, state.txHash, t]);

  useEffect(() => {
    if (state.step !== "minting" || !isReceiptError) {
      return;
    }

    dispatch({
      type: "mint_failed",
      message: t("mint.receiptTimeout"),
    });
  }, [isReceiptError, state.step, t]);

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

        dispatch({ type: "envelope_pinning" });
        const envelopeResult = await completeMintEnvelopeSetup({
          tokenId,
          metadataUri: work.metadataURI,
          signMessageAsync,
          authorAddress: work.author,
          signAuthorMessageAsync:
            address?.toLowerCase() === work.author.toLowerCase()
              ? signMessageAsync
              : undefined,
        });

        dispatch({
          type: "mint_completed",
          envelopeCid: envelopeResult.envelopeCid,
        });
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
  }, [receipt, state.step, address, workId, work.metadataURI, work.author, sendTransactionAsync, signMessageAsync, t]);

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
