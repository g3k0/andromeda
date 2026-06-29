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
