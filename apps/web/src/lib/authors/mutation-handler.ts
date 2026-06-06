import "server-only";

import { verifyWalletSignature } from "@/lib/auth/verify-wallet";
import type { WalletAuthInput } from "./schemas";

export async function verifySignedMutation(
  auth: WalletAuthInput,
): Promise<string> {
  return verifyWalletSignature(auth);
}
