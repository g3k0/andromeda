const ADDRESS_REGEX = /^0x[a-f0-9]{40}$/;

export function normalizeAddress(address: string): string | null {
  const normalized = address.trim().toLowerCase();
  return ADDRESS_REGEX.test(normalized) ? normalized : null;
}

export function defaultDisplayName(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
