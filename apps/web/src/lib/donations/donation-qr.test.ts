import { describe, expect, it } from "vitest";

import { getDonationPaymentUri } from "./constants";
import { generateDonationQrDataUrl } from "./donation-qr";

describe("generateDonationQrDataUrl", () => {
  it("returns a PNG data URL encoding the donation payment URI", async () => {
    const dataUrl = await generateDonationQrDataUrl({ width: 128 });

    expect(dataUrl.startsWith("data:image/png;base64,")).toBe(true);
    expect(dataUrl.length).toBeGreaterThan(100);
  });

  it("encodes the EIP-681 URI used by wallet scanners", async () => {
    expect(getDonationPaymentUri()).toMatch(/^ethereum:0x[a-fA-F0-9]{40}$/);
  });
});
