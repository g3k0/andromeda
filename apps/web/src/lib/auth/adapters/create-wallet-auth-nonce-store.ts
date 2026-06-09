import "server-only";

import { connectMongo } from "@/lib/db/mongodb";
import type { WalletAuthNonceStore } from "../wallet-auth-nonce-store";
import { MongoWalletAuthNonceStore } from "./mongo-wallet-auth-nonce-store";

export async function createMongoWalletAuthNonceStore(): Promise<WalletAuthNonceStore> {
  await connectMongo();
  return new MongoWalletAuthNonceStore();
}
