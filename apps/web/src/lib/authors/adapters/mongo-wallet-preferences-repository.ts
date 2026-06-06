import { WalletPreferencesModel } from "@/lib/db/models/wallet-preferences.model";
import { toWalletPreferences } from "@/lib/db/models/mappers";
import type { WalletPreferencesRepository } from "../repository";
import type { WalletPreferences } from "../types";

export class MongoWalletPreferencesRepository
  implements WalletPreferencesRepository
{
  async getByAddress(address: string): Promise<WalletPreferences | null> {
    const doc = await WalletPreferencesModel.findOne({ address }).lean();
    if (!doc) {
      return null;
    }
    return toWalletPreferences({
      address: doc.address,
      declinedAuthorPage: doc.declinedAuthorPage,
    });
  }

  async set(
    address: string,
    preferences: WalletPreferences,
  ): Promise<WalletPreferences> {
    const doc = await WalletPreferencesModel.findOneAndUpdate(
      { address },
      {
        declinedAuthorPage: preferences.declinedAuthorPage,
        onboardingCompletedAt: new Date(),
      },
      { upsert: true, returnDocument: "after" },
    ).lean();

    return toWalletPreferences({
      address: doc.address,
      declinedAuthorPage: doc.declinedAuthorPage,
    });
  }
}
