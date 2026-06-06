import { connectMongo } from "@/lib/db/mongodb";
import type { AuthorRepositories } from "../repository";
import { MongoAuthorRepository } from "./mongo-author-repository";
import { MongoWalletPreferencesRepository } from "./mongo-wallet-preferences-repository";

export async function createMongoAuthorRepositories(): Promise<AuthorRepositories> {
  await connectMongo();
  return {
    authors: new MongoAuthorRepository(),
    walletPreferences: new MongoWalletPreferencesRepository(),
  };
}
