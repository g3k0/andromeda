export function logWalletPreferencesDeprecation(): void {
  console.warn(
    "Deprecated API: PUT /api/wallet-preferences writes to users.preferences only.",
  );
}
