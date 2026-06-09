import { normalizeAddress } from "@/lib/authors/address";

let adminAddressesOverride: string[] | null = null;

export function parseAdminAddresses(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function getAdminAddresses(): string[] {
  if (adminAddressesOverride) {
    return adminAddressesOverride;
  }
  if (process.env.NEXT_PUBLIC_ADMIN_ADDRESSES) {
    console.warn(
      "NEXT_PUBLIC_ADMIN_ADDRESSES is deprecated; use ADMIN_ADDRESSES server-side only.",
    );
  }

  return parseAdminAddresses(process.env.ADMIN_ADDRESSES);
}

/** @internal Test helper — resets to env-based list when called with null. */
export function setAdminAddressesForTests(addresses: string[] | null): void {
  adminAddressesOverride = addresses;
}

export function isAdminAddress(
  address: string | null | undefined,
  adminList: string[] = getAdminAddresses(),
): boolean {
  const normalized = normalizeAddress(address ?? "");
  if (!normalized) {
    return false;
  }
  return adminList.includes(normalized);
}
