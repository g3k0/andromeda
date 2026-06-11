/** Public donation wallet for infrastructure costs (Polygon / EVM-compatible). */
export const DONATION_WALLET_ADDRESS =
  "0xa49E73bfEFb4B7939D394DB8d2c12B33556ad0ED" as const;

/** EIP-681 URI scanned by most crypto wallets for address-only payments. */
export function getDonationPaymentUri(): `ethereum:${typeof DONATION_WALLET_ADDRESS}` {
  return `ethereum:${DONATION_WALLET_ADDRESS}`;
}
