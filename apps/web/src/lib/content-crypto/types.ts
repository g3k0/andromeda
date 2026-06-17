import type {
  ACE_CONTENT_CIPHER,
  ACE_ENVELOPE_SCHEME,
  ACE_TBA_STANDARD,
  ACE_VERSION,
} from "./ace-spec";

/** 32-byte AES-256 symmetric key (`K`). */
export type ContentKey = Uint8Array;

/** Versioned AES-GCM ciphertext blob for a work's encrypted content. */
export type Ciphertext = Uint8Array;

/** Versioned ECIES envelope wrapping `K` for a token's TBA public key. */
export type Envelope = Uint8Array;

/** Public metadata block embedded in OpenSea-compatible JSON (see ACE plan). */
export type AceMetadataBlock = {
  version: typeof ACE_VERSION;
  encrypted_content: string;
  cipher: typeof ACE_CONTENT_CIPHER;
  envelope_scheme: typeof ACE_ENVELOPE_SCHEME;
  tba_standard: typeof ACE_TBA_STANDARD;
  chain_id: number;
  contract: `0x${string}`;
  registry: `0x${string}`;
};
