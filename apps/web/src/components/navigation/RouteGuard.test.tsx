/** @vitest-environment jsdom */

import type { UserSnapshot } from "@/lib/users/types";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithI18n } from "@/lib/i18n/test-utils";
import { RouteGuard } from "./RouteGuard";

const accountState = vi.hoisted(() => ({
  isConnected: true,
  isReconnecting: false,
}));

const snapshotState = vi.hoisted(() => ({
  snapshot: null as UserSnapshot | null,
}));

vi.mock("wagmi", () => ({
  useAccount: () => accountState,
}));

vi.mock("@/lib/users/use-user-snapshot", () => ({
  useUserSnapshot: () => ({ snapshot: snapshotState.snapshot }),
}));

vi.mock("@/components/WalletButton", () => ({
  WalletButton: () => <button type="button">Connect</button>,
}));

const READER_SNAPSHOT: UserSnapshot = {
  normalizedAddress: "0xabcdef0123456789abcdef0123456789abcdef01",
  isConnected: true,
  roleSlug: "reader",
  roleName: "Reader",
  status: "active",
  permissions: ["pages:read"],
  hasAuthorProfile: false,
  declinedAuthorPage: false,
};

describe("RouteGuard", () => {
  afterEach(() => {
    cleanup();
    accountState.isConnected = true;
    accountState.isReconnecting = false;
    snapshotState.snapshot = READER_SNAPSHOT;
  });

  it("renders localized access denied message", () => {
    snapshotState.snapshot = READER_SNAPSHOT;

    renderWithI18n(
      <RouteGuard routeId="admin">
        <p>Secret admin content</p>
      </RouteGuard>,
    );

    expect(screen.getByText("Access denied")).toBeInTheDocument();
    expect(
      screen.getByText("You are not authorized to access Admin."),
    ).toBeInTheDocument();
  });

  it("renders Italian connect-wallet prompt for protected routes", () => {
    accountState.isConnected = false;
    snapshotState.snapshot = null;

    renderWithI18n(
      <RouteGuard routeId="admin">
        <p>Secret admin content</p>
      </RouteGuard>,
      "it",
    );

    expect(
      screen.getByText("Connetti il wallet per continuare."),
    ).toBeInTheDocument();
  });
});
