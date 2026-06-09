import "server-only";

import { connectMongo } from "@/lib/db/mongodb";
import type { WalletSessionStore } from "../wallet-session-store";
import { MongoWalletSessionStore } from "./mongo-wallet-session-store";

export async function createMongoWalletSessionStore(): Promise<WalletSessionStore> {
  await connectMongo();
  return new MongoWalletSessionStore();
}
