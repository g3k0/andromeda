import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const WALLET_SESSION_COLLECTION_NAME = "wallet_sessions";

const walletSessionSchema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    address: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    roleSlug: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "suspended", "pending"],
    },
    permissions: {
      type: [String],
      required: true,
      default: [],
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    lastSeenAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    collection: WALLET_SESSION_COLLECTION_NAME,
    strict: true,
  },
);

walletSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type WalletSessionDocument = InferSchemaType<typeof walletSessionSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
};

export const WalletSessionModel =
  (mongoose.models.WalletSession as
    | mongoose.Model<WalletSessionDocument>
    | undefined) ??
  mongoose.model<WalletSessionDocument>("WalletSession", walletSessionSchema);
