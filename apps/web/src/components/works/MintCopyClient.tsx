"use client";

import { useReducer } from "react";
import {
  useAccount,
  usePublicClient,
  useSendTransaction,
  useSignMessage,
  useWriteContract,
} from "wagmi";
import type { TransactionReceipt } from "viem";

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
  buildSetCopyEnvelopeRequest,
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
  const publicClient = usePublicClient();

  const [state, dispatch] = useReducer(
    mintCopyClientReducer,
    undefined,
    createMintCopyClientState,
  );

  const availability = getWorkAvailability(work);
  const workId = work.workId;

  async function completeMintAfterReceipt(
    receipt: TransactionReceipt,
    buyer: `0x${string}`,
  ): Promise<void> {
    const tokenId = extractMintedTokenId(receipt.logs, {
      workId,
      buyer,
    });
    dispatch({
      type: "mint_confirmed",
      txHash: receipt.transactionHash,
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
        buyer.toLowerCase() === work.author.toLowerCase()
          ? signMessageAsync
          : undefined,
    });

    if (!envelopeResult.envelopeCid) {
      // Author must provision the envelope later; copy is minted but not yet complete.
      dispatch({
        type: "mint_completed",
        envelopeCid: null,
      });
      return;
    }

    if (!publicClient) {
      throw new Error(t("mint.mintFailed"));
    }

    dispatch({
      type: "envelope_uri_writing",
      envelopeCid: envelopeResult.envelopeCid,
    });
    const envelopeTxHash = await writeContractAsync(
      buildSetCopyEnvelopeRequest({
        tokenId,
        envelopeUri: envelopeResult.envelopeCid,
        contractAddress: getContractAddress(),
        abi: andromedaWorksAbi,
      }),
    );
    await publicClient.waitForTransactionReceipt({ hash: envelopeTxHash });

    dispatch({
      type: "mint_completed",
      envelopeCid: envelopeResult.envelopeCid,
    });
  }

  async function handleMint() {
    if (!isConnected || !address) {
      dispatch({ type: "mint_failed", message: t("mint.connectWallet") });
      return;
    }
    if (!availability.saleOpen) {
      dispatch({ type: "mint_failed", message: t("mint.notAvailable") });
      return;
    }
    if (!publicClient) {
      dispatch({ type: "mint_failed", message: t("mint.mintFailed") });
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

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: RECEIPT_WAIT_TIMEOUT_MS,
      });
      await completeMintAfterReceipt(receipt, address);
    } catch (error) {
      const isTimeout =
        error instanceof Error &&
        (error.name === "WaitForTransactionReceiptTimeoutError" ||
          error.name === "TimeoutError" ||
          /timed? ?out/i.test(error.message));
      const message = isTimeout
        ? t("mint.receiptTimeout")
        : error instanceof Error
          ? error.message
          : t("mint.mintFailed");
      dispatch({
        type: "mint_failed",
        message,
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
      envelopeCid={state.envelopeCid}
      errorMessage={state.errorMessage}
      canMint={isConnected && Boolean(address)}
      onMint={() => {
        void handleMint();
      }}
    />
  );
}
