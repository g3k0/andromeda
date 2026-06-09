import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const ROLE_COLLECTION_NAME = "roles";

const roleSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
    },
    permissions: {
      type: [String],
      required: true,
      default: [],
    },
    isSystem: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: ROLE_COLLECTION_NAME,
    strict: true,
  },
);

export type RoleDocument = InferSchemaType<typeof roleSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const RoleModel =
  (mongoose.models.Role as mongoose.Model<RoleDocument> | undefined) ??
  mongoose.model<RoleDocument>("Role", roleSchema);
