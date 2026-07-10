"use client";

import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { formErrorClassName } from "@/components/form/form-field-styles";
import {
  isMintCopyBusy,
  type MintCopyStep,
} from "@/lib/works/mint-copy-client-state";
import { formatMintAvailabilityLabel } from "@/lib/i18n/work-labels";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { WorkAvailability } from "@/lib/works/mint-copy-tx";

export type MintCopyViewProps = {
  title: string;
  priceLabel: string;
  availability: WorkAvailability;
  step: MintCopyStep;
  tokenId: bigint | null;
  txHash: `0x${string}` | null;
  tbaAddress: `0x${string}` | null;
  errorMessage: string | null;
  /** True when the connected wallet can submit the purchase. */
  canMint: boolean;
  onMint: () => void;
};

const STEP_KEYS: Record<MintCopyStep, string> = {
  idle: "mint.buyCopy",
  minting: "mint.confirmInWallet",
  deploying_tba: "mint.deployingTba",
  pinning_envelope: "mint.pinningEnvelope",
  success: "mint.copyMinted",
  error: "mint.buyCopy",
};

export function MintCopyView({
  title,
  priceLabel,
  availability,
  step,
  tokenId,
  txHash,
  tbaAddress,
  errorMessage,
  canMint,
  onMint,
}: MintCopyViewProps) {
  const { t } = useTranslation();
  const busy = isMintCopyBusy(step);
  const disabled = !canMint || busy || !availability.saleOpen || step === "success";

  return (
    <section className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5">
      <header className="space-y-1">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="text-sm text-white/70">
          {priceLabel} · {formatMintAvailabilityLabel(t, availability)}
        </p>
      </header>

      <button
        type="button"
        disabled={disabled}
        onClick={onMint}
        className="inline-flex items-center gap-2 rounded-lg bg-andromeda px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? <LoadingSpinner size="sm" /> : null}
        {availability.soldOut ? t("mint.soldOut") : t(STEP_KEYS[step])}
      </button>

      {step === "success" ? (
        <div className="space-y-1 text-sm text-emerald-400">
          <p>{t("mint.successMessage", { tokenId: tokenId?.toString() ?? "" })}</p>
          {tbaAddress ? (
            <p className="break-all text-xs text-white/60">
              {t("mint.tokenAccount", { address: tbaAddress })}
            </p>
          ) : null}
          {txHash ? (
            <p className="break-all text-xs text-white/60">
              {t("mint.transaction", { hash: txHash })}
            </p>
          ) : null}
        </div>
      ) : null}

      {errorMessage ? (
        <p className={formErrorClassName} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
