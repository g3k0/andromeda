/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WALLET_DISCONNECTED_MESSAGE } from "@/lib/notifications/messages";
import { WalletButton } from "./WalletButton";

const mockPush = vi.fn();
const mockDisconnect = vi.fn();
const mockConnect = vi.fn();
const mockNotify = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/components/notifications/NotificationProvider", () => ({
  useNotifications: () => ({
    notify: mockNotify,
    dismiss: vi.fn(),
  }),
}));

vi.mock("wagmi", () => ({
  useAccount: vi.fn(),
  useConnect: vi.fn(),
  useDisconnect: vi.fn(),
}));

import { useAccount, useConnect, useDisconnect } from "wagmi";

const mockedUseAccount = vi.mocked(useAccount);
const mockedUseConnect = vi.mocked(useConnect);
const mockedUseDisconnect = vi.mocked(useDisconnect);

describe("WalletButton", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("notifies and redirects home after disconnect", async () => {
    const user = userEvent.setup();

    mockedUseAccount.mockReturnValue({
      address: "0xabcdef0123456789abcdef0123456789abcdef01",
      isConnected: true,
    } as ReturnType<typeof useAccount>);
    mockedUseConnect.mockReturnValue({
      connect: mockConnect,
      connectors: [],
      isPending: false,
    } as ReturnType<typeof useConnect>);
    mockedUseDisconnect.mockImplementation((options) => {
      return {
        disconnect: () => {
          mockDisconnect();
          options?.mutation?.onSuccess?.();
        },
      } as ReturnType<typeof useDisconnect>;
    });

    render(<WalletButton />);

    await user.click(screen.getByRole("button", { name: /disconnect/i }));

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(mockNotify).toHaveBeenCalledWith({
      variant: "info",
      message: WALLET_DISCONNECTED_MESSAGE,
    });
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});
