import mongoose, { Schema, type InferSchemaType } from "mongoose";
import {
  AUTHOR_AVATAR_URL_MAX_LENGTH,
  AUTHOR_BIO_MAX_LENGTH,
  AUTHOR_DISPLAY_NAME_MAX_LENGTH,
} from "@/lib/authors/field-limits";

/** MongoDB collection for author profiles (explicit — do not use `author`). */
export const AUTHOR_COLLECTION_NAME = "authors";

const authorSchema = new Schema(
  {
    address: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: AUTHOR_DISPLAY_NAME_MAX_LENGTH,
    },
    avatarUrl: {
      type: String,
      default: null,
      maxlength: AUTHOR_AVATAR_URL_MAX_LENGTH,
    },
    bio: {
      type: String,
      default: null,
      maxlength: AUTHOR_BIO_MAX_LENGTH,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: AUTHOR_COLLECTION_NAME,
  },
);

export type AuthorDocument = InferSchemaType<typeof authorSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const AuthorModel =
  (mongoose.models.Author as mongoose.Model<AuthorDocument> | undefined) ??
  mongoose.model<AuthorDocument>("Author", authorSchema);
