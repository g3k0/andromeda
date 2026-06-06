import mongoose, { Schema, type InferSchemaType } from "mongoose";

const walletPreferencesSchema = new Schema(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    declinedAuthorPage: {
      type: Boolean,
      required: true,
      default: false,
    },
    onboardingCompletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type WalletPreferencesDocument = InferSchemaType<
  typeof walletPreferencesSchema
> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const WalletPreferencesModel =
  (mongoose.models.WalletPreferences as
    | mongoose.Model<WalletPreferencesDocument>
    | undefined) ??
  mongoose.model<WalletPreferencesDocument>(
    "WalletPreferences",
    walletPreferencesSchema,
  );
