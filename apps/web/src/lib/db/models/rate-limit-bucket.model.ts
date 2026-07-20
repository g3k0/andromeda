import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const RATE_LIMIT_BUCKET_COLLECTION_NAME = "rate_limit_buckets";

const rateLimitBucketSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    count: {
      type: Number,
      required: true,
      default: 1,
    },
    resetAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
    collection: RATE_LIMIT_BUCKET_COLLECTION_NAME,
    strict: true,
  },
);

rateLimitBucketSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

export type RateLimitBucketDocument = InferSchemaType<
  typeof rateLimitBucketSchema
> & {
  _id: mongoose.Types.ObjectId;
};

export const RateLimitBucketModel =
  (mongoose.models.RateLimitBucket as
    | mongoose.Model<RateLimitBucketDocument>
    | undefined) ??
  mongoose.model<RateLimitBucketDocument>(
    "RateLimitBucket",
    rateLimitBucketSchema,
  );
