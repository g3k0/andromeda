import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const WALLET_AUTH_NONCE_COLLECTION_NAME = "wallet_auth_nonces";

const walletAuthNonceSchema = new Schema(
  {
    nonce: {
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
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    used: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: false,
    versionKey: false,
    collection: WALLET_AUTH_NONCE_COLLECTION_NAME,
    strict: true,
  },
);

walletAuthNonceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type WalletAuthNonceDocument = InferSchemaType<
  typeof walletAuthNonceSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const WalletAuthNonceModel =
  (mongoose.models.WalletAuthNonce as
    | mongoose.Model<WalletAuthNonceDocument>
    | undefined) ??
  mongoose.model<WalletAuthNonceDocument>(
    "WalletAuthNonce",
    walletAuthNonceSchema,
  );
