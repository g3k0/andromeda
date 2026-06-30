import mongoose, { Schema, type InferSchemaType } from "mongoose";

/** MongoDB collection tracking the indexer's chain sync cursor (singleton-ish). */
export const CHAIN_SYNC_COLLECTION_NAME = "chain_sync";

/** Fixed key for the single AndromedaWorks sync cursor document. */
export const ANDROMEDA_WORKS_SYNC_KEY = "andromeda-works";

const chainSyncSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    lastProcessedBlock: {
      type: String,
      required: true,
      default: "0",
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: CHAIN_SYNC_COLLECTION_NAME,
  },
);

export type ChainSyncDocument = InferSchemaType<typeof chainSyncSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const ChainSyncModel =
  (mongoose.models.ChainSync as mongoose.Model<ChainSyncDocument> | undefined) ??
  mongoose.model<ChainSyncDocument>("ChainSync", chainSyncSchema);
