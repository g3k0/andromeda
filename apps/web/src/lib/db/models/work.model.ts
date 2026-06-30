import mongoose, { Schema, type InferSchemaType } from "mongoose";

/** MongoDB collection for the off-chain projection of on-chain works. */
export const WORK_COLLECTION_NAME = "works";

const workSchema = new Schema(
  {
    workId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    author: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    metadataURI: {
      type: String,
      required: true,
      trim: true,
    },
    encryptedContentCid: {
      type: String,
      default: null,
    },
    price: {
      type: String,
      required: true,
    },
    maxCopies: {
      type: String,
      required: true,
    },
    minted: {
      type: String,
      required: true,
      default: "0",
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: WORK_COLLECTION_NAME,
  },
);

export type WorkDocument = InferSchemaType<typeof workSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const WorkModel =
  (mongoose.models.Work as mongoose.Model<WorkDocument> | undefined) ??
  mongoose.model<WorkDocument>("Work", workSchema);
