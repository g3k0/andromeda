/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/lib/i18n/I18nProvider";
import type { WorkAvailability } from "@/lib/works/mint-copy-tx";

import { MintCopyView } from "./MintCopyView";

const OPEN: WorkAvailability = {
  remaining: 60n,
  soldOut: false,
  saleOpen: true,
};

afterEach(() => {
  cleanup();
});

describe("MintCopyView", () => {
  it("shows price and remaining copies and triggers mint", async () => {
    const user = userEvent.setup();
    const onMint = vi.fn();

    render(
      <I18nProvider locale="en">
        <MintCopyView
          title="The Star Gate"
          priceLabel="0.05 POL"
          availability={OPEN}
          step="idle"
          tokenId={null}
          txHash={null}
          tbaAddress={null}
          envelopeCid={null}
          errorMessage={null}
          canMint
          onMint={onMint}
        />
      </I18nProvider>,
    );

    expect(screen.getByText(/0\.05 POL/)).toBeInTheDocument();
    expect(screen.getByText(/60 copies left/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Buy a copy/i }));
    expect(onMint).toHaveBeenCalledTimes(1);
  });

  it("disables the button when the edition is sold out", () => {
    render(
      <I18nProvider locale="en">
        <MintCopyView
          title="The Star Gate"
          priceLabel="0.05 POL"
          availability={{ remaining: 0n, soldOut: true, saleOpen: false }}
          step="idle"
          tokenId={null}
          txHash={null}
          tbaAddress={null}
          envelopeCid={null}
          errorMessage={null}
          canMint
          onMint={() => undefined}
        />
      </I18nProvider>,
    );

    expect(screen.getByRole("button", { name: /Sold out/i })).toBeDisabled();
  });

  it("renders the minted token id on success", () => {
    render(
      <I18nProvider locale="en">
        <MintCopyView
          title="The Star Gate"
          priceLabel="0.05 POL"
          availability={OPEN}
          step="success"
          tokenId={42n}
          txHash="0xabc"
          tbaAddress="0x000000000000000000000000000000000000dEaD"
          envelopeCid="ar://EnvelopeTx"
          errorMessage={null}
          canMint
          onMint={() => undefined}
        />
      </I18nProvider>,
    );

    expect(screen.getByText(/Copy #42 is ready to read/)).toBeInTheDocument();
  });
});
