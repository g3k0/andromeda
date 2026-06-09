import mongoose, { Schema, type InferSchemaType } from "mongoose";

/** MongoDB collection for platform users (identity + role + prefs). */
export const USER_COLLECTION_NAME = "users";

const userSchema = new Schema(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    roleSlug: {
      type: String,
      required: true,
      default: "reader",
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "suspended", "pending"],
      default: "active",
    },
    permissionOverrides: {
      type: [String],
      default: [],
    },
    preferences: {
      declinedAuthorPage: { type: Boolean, default: false },
      onboardingCompletedAt: { type: Date, default: null },
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: USER_COLLECTION_NAME,
    strict: true,
  },
);

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const UserModel =
  (mongoose.models.User as mongoose.Model<UserDocument> | undefined) ??
  mongoose.model<UserDocument>("User", userSchema);
