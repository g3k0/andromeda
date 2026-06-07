/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WalletButton } from "./WalletButton";

vi.mock("wagmi", () => ({
  useAccount: vi.fn(),
  useConnect: vi.fn(),
}));

import { useAccount, useConnect } from "wagmi";

const mockedUseAccount = vi.mocked(useAccount);
const mockedUseConnect = vi.mocked(useConnect);

describe("WalletButton", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders nothing when the wallet is connected", () => {
    mockedUseAccount.mockReturnValue({
      address: "0xabcdef0123456789abcdef0123456789abcdef01",
      isConnected: true,
    } as ReturnType<typeof useAccount>);
    mockedUseConnect.mockReturnValue({
      connect: vi.fn(),
      connectors: [],
      isPending: false,
    } as ReturnType<typeof useConnect>);

    const { container } = render(<WalletButton />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the connect action when disconnected", () => {
    mockedUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
    } as ReturnType<typeof useAccount>);
    mockedUseConnect.mockReturnValue({
      connect: vi.fn(),
      connectors: [{ id: "mock" }],
      isPending: false,
    } as ReturnType<typeof useConnect>);

    render(<WalletButton />);

    expect(
      screen.getByRole("button", { name: /connect wallet/i }),
    ).toBeInTheDocument();
  });
});
