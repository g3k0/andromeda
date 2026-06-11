import { isAddress } from "viem";
import { describe, expect, it } from "vitest";

import {
  DONATION_WALLET_ADDRESS,
  getDonationPaymentUri,
} from "./constants";

describe("donation constants", () => {
  it("uses a valid checksummed EVM address", () => {
    expect(isAddress(DONATION_WALLET_ADDRESS)).toBe(true);
  });

  it("builds an EIP-681 payment URI for wallet QR scanners", () => {
    expect(getDonationPaymentUri()).toBe(
      `ethereum:${DONATION_WALLET_ADDRESS}`,
    );
  });
});
