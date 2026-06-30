import mongoose, { Schema, type InferSchemaType } from "mongoose";

/** MongoDB collection for the off-chain projection of minted copies (tokens). */
export const TOKEN_COLLECTION_NAME = "tokens";

const tokenSchema = new Schema(
  {
    tokenId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    workId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    owner: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    copyNumber: {
      type: Number,
      default: null,
    },
    tbaAddress: {
      type: String,
      default: null,
    },
    envelopeCid: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: TOKEN_COLLECTION_NAME,
  },
);

export type TokenDocument = InferSchemaType<typeof tokenSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const TokenModel =
  (mongoose.models.Token as mongoose.Model<TokenDocument> | undefined) ??
  mongoose.model<TokenDocument>("Token", tokenSchema);
