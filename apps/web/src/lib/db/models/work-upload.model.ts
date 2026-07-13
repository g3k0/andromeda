import mongoose, { Schema, type InferSchemaType } from "mongoose";

/** MongoDB collection for off-chain work upload metadata (pre/post register). */
export const WORK_UPLOAD_COLLECTION_NAME = "work_uploads";

const workImprintSchema = new Schema(
  {
    publication_date: { type: String, required: true, trim: true },
    edition_number: { type: Number, required: true, min: 1 },
    edition_kind: {
      type: String,
      required: true,
      enum: ["first", "reprint"],
    },
    reprint_number: { type: Number, default: null, min: 1 },
    series_name: { type: String, default: null, trim: true },
    series_volume: { type: Number, default: null, min: 1 },
    language: { type: String, default: null, trim: true },
    original_publication_date: { type: String, default: null, trim: true },
    back_cover_text: { type: String, required: true, trim: true },
    about_author: { type: String, required: true, trim: true },
    author_address: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
  },
  { _id: false },
);

const workUploadSchema = new Schema(
  {
    author: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    metadataURI: {
      type: String,
      required: true,
      trim: true,
    },
    metadataCid: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    contentCid: {
      type: String,
      required: true,
      trim: true,
    },
    coverCid: {
      type: String,
      required: true,
      trim: true,
    },
    externalUrl: {
      type: String,
      default: null,
      trim: true,
    },
    workImprint: {
      type: workImprintSchema,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["uploaded", "registered"],
      default: "uploaded",
      index: true,
    },
    workId: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    registeredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: WORK_UPLOAD_COLLECTION_NAME,
  },
);

workUploadSchema.index({ author: 1, createdAt: -1 });
workUploadSchema.index({ metadataURI: 1 }, { unique: true });

export type WorkUploadDocument = InferSchemaType<typeof workUploadSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const WorkUploadModel =
  (mongoose.models.WorkUpload as
    | mongoose.Model<WorkUploadDocument>
    | undefined) ??
  mongoose.model<WorkUploadDocument>("WorkUpload", workUploadSchema);
