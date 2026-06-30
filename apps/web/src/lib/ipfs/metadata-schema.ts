import { z } from "zod";

import {
  ACE_CONTENT_CIPHER,
  ACE_ENVELOPE_SCHEME,
  ACE_TBA_STANDARD,
  ACE_VERSION,
} from "@/lib/content-crypto/ace-spec";

import { IpfsMetadataValidationError } from "./errors";

const IPFS_URI_PATTERN = /^ipfs:\/\/.+/;

const addressSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/, "Expected a checksummed hex address");

const ipfsUriSchema = z
  .string()
  .regex(IPFS_URI_PATTERN, "Expected an ipfs:// URI");

const attributeSchema = z.object({
  trait_type: z.string().min(1),
  value: z.union([z.string(), z.number()]),
});

export const workImprintMetadataSchema = z
  .object({
    publication_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    edition_number: z.number().int().min(1),
    edition_kind: z.enum(["first", "reprint"]),
    reprint_number: z.number().int().min(1).optional(),
    series_name: z.string().min(1).max(120).optional(),
    series_volume: z.number().int().min(1).optional(),
    language: z.string().min(2).max(32).optional(),
    original_publication_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    back_cover_text: z.string().min(1).max(2000),
    about_author: z.string().min(1).max(1000),
    author_address: addressSchema,
  })
  .superRefine((value, ctx) => {
    if (value.edition_kind === "reprint" && value.reprint_number === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reprint number is required for a reprint edition.",
        path: ["reprint_number"],
      });
    }
    if (value.edition_kind === "first" && value.reprint_number !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reprint number applies only to reprint editions.",
        path: ["reprint_number"],
      });
    }
    if (value.series_name && value.series_volume === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Series volume is required when a series name is provided.",
        path: ["series_volume"],
      });
    }
  });

export type WorkImprintMetadata = z.infer<typeof workImprintMetadataSchema>;

const aceMetadataBlockSchema = z.object({
  version: z.literal(ACE_VERSION),
  encrypted_content: ipfsUriSchema,
  cipher: z.literal(ACE_CONTENT_CIPHER),
  envelope_scheme: z.literal(ACE_ENVELOPE_SCHEME),
  tba_standard: z.literal(ACE_TBA_STANDARD),
  chain_id: z.number().int().positive(),
  contract: addressSchema,
  registry: addressSchema,
});

export const acePublicMetadataSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().min(1),
    image: ipfsUriSchema,
    external_url: z.string().url().optional(),
    attributes: z.array(attributeSchema).optional(),
    work_imprint: workImprintMetadataSchema,
    ace: aceMetadataBlockSchema,
  })
  .strict();

export type AcePublicMetadata = z.infer<typeof acePublicMetadataSchema>;

const FORBIDDEN_METADATA_KEYS = new Set([
  "contentkey",
  "content_key",
  "private_key",
  "privatekey",
  "plaintext",
  "plaintext_content",
  "plaintextcontent",
  "symmetric_key",
  "symmetrickey",
  "decrypt_key",
  "decryptkey",
  "k",
]);

const PLAINTEXT_ATTRIBUTE_TRAITS = new Set([
  "plaintext",
  "plaintext_content",
  "full_text",
  "fulltext",
  "story_text",
  "storytext",
  "content",
  "manuscript",
]);

function collectForbiddenKeys(
  value: unknown,
  path = "",
  issues: string[] = [],
): string[] {
  if (value === null || typeof value !== "object") {
    return issues;
  }

  if (Array.isArray(value)) {
    for (const [index, entry] of value.entries()) {
      collectForbiddenKeys(entry, `${path}[${index}]`, issues);
    }
    return issues;
  }

  for (const [key, entry] of Object.entries(value)) {
    const keyPath = path ? `${path}.${key}` : key;
    if (FORBIDDEN_METADATA_KEYS.has(key.toLowerCase())) {
      issues.push(`Forbidden metadata key: ${keyPath}`);
    }
    collectForbiddenKeys(entry, keyPath, issues);
  }

  return issues;
}

function collectPlaintextAttributeIssues(
  attributes: readonly { trait_type: string; value: string | number }[],
): string[] {
  const issues: string[] = [];

  for (const [index, attribute] of attributes.entries()) {
    const trait = attribute.trait_type.trim().toLowerCase();
    if (PLAINTEXT_ATTRIBUTE_TRAITS.has(trait)) {
      issues.push(
        `attributes[${index}] exposes plaintext content via trait_type "${attribute.trait_type}"`,
      );
    }

    if (
      typeof attribute.value === "string" &&
      attribute.value.startsWith("ipfs://") &&
      trait.includes("plaintext")
    ) {
      issues.push(
        `attributes[${index}] references a plaintext content CID`,
      );
    }
  }

  return issues;
}

export function parseAcePublicMetadata(input: unknown): AcePublicMetadata {
  const parsed = acePublicMetadataSchema.safeParse(input);
  if (!parsed.success) {
    throw new IpfsMetadataValidationError(
      "Invalid ACE public metadata",
      parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "root"}: ${issue.message}`,
      ),
    );
  }

  const securityIssues = [
    ...collectForbiddenKeys(input),
    ...collectPlaintextAttributeIssues(parsed.data.attributes ?? []),
  ];

  if (securityIssues.length > 0) {
    throw new IpfsMetadataValidationError(
      "ACE public metadata rejected for security reasons",
      securityIssues,
    );
  }

  return parsed.data;
}

export function isAcePublicMetadata(input: unknown): input is AcePublicMetadata {
  try {
    parseAcePublicMetadata(input);
    return true;
  } catch {
    return false;
  }
}
