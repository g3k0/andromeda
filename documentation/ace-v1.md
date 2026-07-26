# ACE v1 — Andromeda Content Encryption

> Open specification for **third-party readers** of Andromeda works.
>
> ACE describes how a literary work is encrypted once, published to permanent
> storage (normative URI scheme `ar://` on Arweave; legacy `ipfs://` still
> accepted in read), and made readable **only by the owner of a specific copy
> (ERC-721 token)** through its ERC-6551 token bound account (TBA). Anyone can
> implement a compatible reader from this document alone — no access to
> Andromeda servers is required.

- **Version:** `1`
- **Content cipher:** `aes-256-gcm`
- **Envelope scheme:** `ecies-secp256k1`
- **TBA standard:** `erc-6551`

These identifiers appear verbatim in the on-chain-referenced metadata (`ace`
block) so a reader can detect the scheme before attempting decryption.

---

## 1. Design in one paragraph

The plaintext work is encrypted **once** with a random 256-bit symmetric key
`K` (AES-256-GCM). The resulting ciphertext is uploaded to permanent storage
(Arweave via `ar://` URI; legacy `ipfs://` may still appear on older works) and
shared by every copy of the work. For each minted copy, `K` is **wrapped**
(ECIES over secp256k1) for the public key of that copy's reader identity,
producing a small per-token *envelope* that is also stored permanently. To
read, the owner recovers their private key from a wallet signature, unwraps the
envelope to recover `K`, and decrypts the shared ciphertext. The ciphertext and
envelope are byte-for-byte independent of the copy number, so numbered editions
do not change the crypto.

```
plaintext ──AES-256-GCM(K)──▶ ciphertext ──▶ ar://…  (shared by all copies)
      K   ──ECIES(pubKey_i)──▶ envelope_i ──▶ ar://…  (one per token i)
owner_i signs message ─▶ privKey_i ─▶ unwrap(envelope_i) ─▶ K ─▶ decrypt
```

---

## 2. Binary layouts

All blobs are raw bytes at a content URI (not JSON). Multi-byte integers are
big-endian. The leading byte is a **format version** so future revisions can
coexist.

### 2.1 Ciphertext blob

```
┌────────┬──────────────┬────────────────────────────────────────────┐
│ 1 byte │ 12 bytes     │ N bytes                                      │
│ 0x01   │ IV (nonce)   │ AES-256-GCM ciphertext ‖ 16-byte auth tag    │
└────────┴──────────────┴────────────────────────────────────────────┘
```

- Byte `0` — ciphertext format version, currently `0x01`.
- Bytes `1..13` — 96-bit AES-GCM initialization vector (random per encryption).
- Bytes `13..` — AES-256-GCM output. As produced by the Web Crypto API, the
  16-byte authentication tag is **appended** to the ciphertext (i.e.
  `ciphertext ‖ tag`). GCM tag length is 128 bits.
- Minimum valid length: `1 + 12 + 16 = 29` bytes.

Encryption/decryption use `SubtleCrypto` `AES-GCM` with `tagLength: 128`, no
additional authenticated data (AAD).

### 2.2 Envelope blob

```
┌────────┬───────────────────────────────────────────────┐
│ 1 byte │ M bytes                                         │
│ 0x01   │ ECIES(secp256k1) payload wrapping K (32 bytes)  │
└────────┴───────────────────────────────────────────────┘
```

- Byte `0` — envelope format version, currently `0x01`.
- Bytes `1..` — ECIES ciphertext over **secp256k1**, encrypting the 32-byte
  content key `K`.
- The reference implementation uses [`eciesjs`](https://github.com/ecies/js)
  with its default serialization: `ephemeral_public_key ‖ nonce ‖
  aes-gcm(ciphertext ‖ tag)`. A compatible third-party reader MUST use an ECIES
  implementation interoperable with `eciesjs` defaults (secp256k1, HKDF-SHA256,
  AES-256-GCM).
- Minimum ECIES payload length accepted: `33` bytes.

### 2.3 Content key `K`

`K` is 32 uniformly random bytes (`crypto.getRandomValues`). It is never stored
in plaintext, never sent to a server, and never placed in any JSON metadata.

---

## 3. Public metadata (`ace` block)

Each work publishes an OpenSea-compatible JSON document to permanent storage;
its content URI is the on-chain `metadataURI` (per-work) or the per-token
`tokenURI` for numbered editions. Normative scheme is `ar://`; legacy
`ipfs://` URIs remain valid for reading older works. Beyond the standard
`name` / `description` / `image` / `attributes`, it carries an `ace` block that
tells a reader how to decrypt:

```json
{
  "name": "The Star Gate — Copy #7 / 100",
  "description": "…author-composed colophon…",
  "image": "ar://CoverTxId…",
  "attributes": [
    { "trait_type": "Copy number", "value": 7 },
    { "trait_type": "Edition size", "value": "100" }
  ],
  "work_imprint": { "…": "structured colophon" },
  "ace": {
    "version": "1",
    "encrypted_content": "ar://CiphertextTxId…",
    "cipher": "aes-256-gcm",
    "envelope_scheme": "ecies-secp256k1",
    "tba_standard": "erc-6551",
    "chain_id": 80002,
    "contract": "0xTheAndromedaWorksContract",
    "registry": "0xTheErc6551Registry"
  }
}
```

Rules:

- `image` and `ace.encrypted_content` MUST be content URIs: `ar://…` (normative)
  or `ipfs://…` (legacy).
- `ace.encrypted_content` points to the **shared ciphertext blob** (§2.1).
- `chain_id`, `contract`, `registry` are the parameters needed to compute the
  copy's TBA (§4).
- The public metadata **never** contains `K`, a private key, or plaintext. The
  Andromeda validator rejects forbidden keys (`content_key`, `private_key`,
  `plaintext`, …) and plaintext-exposing attribute traits.
- The **envelope URI is not stored in the public metadata.** It is discovered
  off-chain (see §5): the envelope is stored with the deterministic name
  `token-<tokenId>-envelope` and indexed per token.

---

## 4. Computing the copy's TBA (ERC-6551)

Each token has a deterministic token bound account address, computed with
CREATE2 exactly as the canonical ERC-6551 registry does:

```
creationCode =
    0x3d60ad80600a3d3981f3363d3d373d3d3d363d73   // ERC-1167 header
  ‖ implementation (20 bytes)
  ‖ 0x5af43d82803e903d91602b57fd5bf3             // ERC-1167 footer
  ‖ salt      (32 bytes)
  ‖ chainId   (32 bytes, big-endian)
  ‖ contract  (32 bytes, left-padded token contract)
  ‖ tokenId   (32 bytes, big-endian)

tba = CREATE2(
  deployer  = registry,
  salt      = salt,
  initCodeHash = keccak256(creationCode)
)
```

- `salt` defaults to `0x00…00` (32 zero bytes).
- `implementation` is the ERC-6551 account proxy (`NEXT_PUBLIC_ERC6551_IMPLEMENTATION`,
  defaulting to the Tokenbound v0.3.1 proxy `0x55266d75D1a14E4572138116aF39863Ed6596E7F`).
- `registry` is the canonical Tokenbound registry
  `0x000000006551c19487814612e58FE06813775758` unless overridden.

The TBA is the reader identity for the copy. In ACE v1 the envelope is wrapped
so that the copy owner — proving control of the token / TBA — can unwrap `K`.

---

## 5. Reader key derivation

ACE v1 derives a deterministic secp256k1 reading keypair from a **wallet
signature**, so the owner needs no extra key material:

1. The owner signs the fixed EIP-191 personal-sign message:

   ```
   Andromeda reader key v1
   ```

2. `secret = keccak256(signature)` (32 bytes).
3. `privKey = secp256k1(secret)`; `pubKey = compressed public key`.

The envelope for a copy **must** be wrapped to the `pubKey` derived from the
same signature, so that only the wallet able to produce that signature can
unwrap `K`. Implementations that bind the envelope to the on-chain TBA public
key instead must document that variant; ACE v1 readers assume the
signature-derived key above.

> Discovery of the per-token envelope URI is deployment-specific. Andromeda
> stores each envelope as `token-<tokenId>-envelope` and exposes it through its
> indexer (`tokens.envelopeCid`, which may hold a CID or content URI). A
> third-party reader that maintains its own index can resolve the same blob from
> the storage name or from its own records.

---

## 6. End-to-end decryption flow

Given a `tokenId` the reader owns:

1. **Resolve metadata.** Read the token's `tokenURI` (numbered editions) or the
   work's `metadataURI`; parse the `ace` block. Verify `ace.version == "1"` and
   the `cipher` / `envelope_scheme` / `tba_standard` identifiers. Resolve
   `ar://` / legacy `ipfs://` via an appropriate HTTPS gateway.
2. **Fetch ciphertext.** Download the blob at `ace.encrypted_content` (§2.1),
   resolving the content URI through a gateway.
3. **Fetch envelope.** Resolve and download the per-token envelope blob (§2.2,
   §5).
4. **Derive keys.** Ask the wallet to sign `Andromeda reader key v1`; derive
   `privKey` (§5).
5. **Unwrap.** `K = ECIES_decrypt(privKey, envelope[1..])` and assert
   `K.length == 32`.
6. **Decrypt.** `plaintext = AES-256-GCM_decrypt(K, iv = ciphertext[1..13],
   data = ciphertext[13..])`. A GCM tag failure means wrong key or tampered
   data — surface a generic error.
7. **Render.** Decode `plaintext` (UTF-8 for text works) and display.

Steps 2–3 can run in parallel. `K` and `privKey` must live only in the reading
runtime and never be persisted or transmitted.

---

## 7. Worked example (non-normative)

Illustrative values only — not a real work.

```
Content key K (hex, 32 bytes):
  3b1e...c7a9                       # 64 hex chars, kept client-side only

Ciphertext blob (hex, truncated):
  01                                # format version
  9f2c4a7b1d3e5f60718293a4          # 12-byte IV
  5d8e…<aes-gcm ciphertext‖tag>…    # remainder

Envelope blob (hex, truncated):
  01                                # format version
  04a1…<eciesjs secp256k1 payload>… # ephemeral pubkey ‖ nonce ‖ aes-gcm

Content URIs (normative ar://; legacy ipfs:// still readable):
  ar://CoverTxId…                    # image (public)
  ar://CipherTxId…                   # ace.encrypted_content (shared)
  ar://MetaTxId…                     # tokenURI / metadataURI (public)
  ar://EnvelopeTxId…                 # per-token envelope (owner-only use)

TBA for tokenId 7:
  chainId  = 80002 (Polygon Amoy)
  contract = 0x…AndromedaWorks
  registry = 0x000000006551c19487814612e58FE06813775758
  impl     = 0x55266d75D1a14E4572138116aF39863Ed6596E7F
  salt     = 0x00…00
  ⇒ tba = CREATE2(registry, salt, keccak256(creationCode))
```

---

## 8. Reference implementation map

The normative behavior above corresponds to these modules in `apps/web`:

| Concern | Module |
| --- | --- |
| Scheme constants | `src/lib/content-crypto/ace-spec.ts` |
| Content cipher (AES-256-GCM) | `src/lib/content-crypto/content-cipher.ts` |
| Envelope (ECIES) | `src/lib/content-crypto/envelope.ts` |
| Decrypt workflow | `src/lib/content-crypto/decrypt-workflow.ts` |
| Reader key derivation | `src/lib/works/reader-signer.ts` |
| Public metadata schema | `src/lib/ipfs/metadata-schema.ts` |
| Per-token numbered metadata | `src/lib/works/token-metadata.ts` |
| TBA address (ERC-6551) | `src/lib/tba/tba-address.ts` |

See also the overall design in
[`plans/web3-layer-architecture.md`](plans/web3-layer-architecture.md).
