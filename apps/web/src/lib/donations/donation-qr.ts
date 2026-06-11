import QRCode from "qrcode";

import { getDonationPaymentUri } from "./constants";

export async function generateDonationQrDataUrl(
  options?: { width?: number },
): Promise<string> {
  return QRCode.toDataURL(getDonationPaymentUri(), {
    errorCorrectionLevel: "M",
    margin: 2,
    width: options?.width ?? 200,
  });
}
