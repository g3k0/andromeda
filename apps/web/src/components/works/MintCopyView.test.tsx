/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

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
      <MintCopyView
        title="The Star Gate"
        priceLabel="0.05 POL"
        availability={OPEN}
        step="idle"
        tokenId={null}
        txHash={null}
        tbaAddress={null}
        errorMessage={null}
        canMint
        onMint={onMint}
      />,
    );

    expect(screen.getByText(/0\.05 POL/)).toBeInTheDocument();
    expect(screen.getByText(/60 copies left/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Buy a copy/i }));
    expect(onMint).toHaveBeenCalledTimes(1);
  });

  it("disables the button when the edition is sold out", () => {
    render(
      <MintCopyView
        title="The Star Gate"
        priceLabel="0.05 POL"
        availability={{ remaining: 0n, soldOut: true, saleOpen: false }}
        step="idle"
        tokenId={null}
        txHash={null}
        tbaAddress={null}
        errorMessage={null}
        canMint
        onMint={() => undefined}
      />,
    );

    expect(screen.getByRole("button", { name: /Sold out/i })).toBeDisabled();
  });

  it("renders the minted token id on success", () => {
    render(
      <MintCopyView
        title="The Star Gate"
        priceLabel="0.05 POL"
        availability={OPEN}
        step="success"
        tokenId={42n}
        txHash="0xabc"
        tbaAddress="0x000000000000000000000000000000000000dEaD"
        errorMessage={null}
        canMint
        onMint={() => undefined}
      />,
    );

    expect(screen.getByText(/Copy #42 minted successfully/)).toBeInTheDocument();
  });
});
