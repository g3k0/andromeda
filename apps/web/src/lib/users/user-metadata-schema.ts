import { z } from "zod";

const MAX_METADATA_KEYS = 20;
const MAX_METADATA_DEPTH = 3;
const MAX_METADATA_JSON_LENGTH = 4_096;

function measureDepth(value: unknown, depth = 0): number {
  if (value === null || typeof value !== "object") {
    return depth;
  }

  if (Array.isArray(value)) {
    return value.reduce(
      (maxDepth, entry) => Math.max(maxDepth, measureDepth(entry, depth + 1)),
      depth + 1,
    );
  }

  return Object.values(value).reduce(
    (maxDepth, entry) => Math.max(maxDepth, measureDepth(entry, depth + 1)),
    depth + 1,
  );
}

export const userMetadataSchema = z
  .record(z.string().max(64), z.unknown())
  .superRefine((metadata, context) => {
    const keys = Object.keys(metadata);
    if (keys.length > MAX_METADATA_KEYS) {
      context.addIssue({
        code: "custom",
        message: "User metadata exceeds the maximum number of keys.",
      });
    }

    if (measureDepth(metadata) > MAX_METADATA_DEPTH) {
      context.addIssue({
        code: "custom",
        message: "User metadata exceeds the maximum nesting depth.",
      });
    }

    if (JSON.stringify(metadata).length > MAX_METADATA_JSON_LENGTH) {
      context.addIssue({
        code: "custom",
        message: "User metadata exceeds the maximum serialized size.",
      });
    }
  });
