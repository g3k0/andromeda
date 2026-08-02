# Arweave / Turbo runbook (Preview cutover)

Operational guide for permanent storage writes after storage-independence **PR7**.
Preview always writes to Arweave; Pinata is legacy opt-in only and is ignored when
`VERCEL_ENV=preview`.

## Required env (Preview / local cutover)

| Variable | Required | Notes |
| --- | --- | --- |
| `PERMANENT_STORAGE_BACKEND` | recommended | Default is `arweave`. On Preview the factory forces Arweave even if set to `pinata`. |
| `ARWEAVE_JWK` (or `ARWEAVE_TURBO_JWK`) | **yes** | Full JWK JSON on one line. Server-only. Never commit. |
| `ARWEAVE_GATEWAY_URLS` | recommended | Comma-separated failover list, e.g. `https://arweave.net,https://ar-io.net`. |
| `ARWEAVE_GATEWAY_BASE_URL` | optional | Single primary when the list is empty. |

Pinata (`IPFS_PINNING_API_KEY`) is **not** required for Preview publish. DoD: with Pinata
down or unset, Preview publish still produces `ar://` URIs.

## Turbo credits

1. Fund the Arweave wallet that owns `ARWEAVE_JWK` via [Turbo](https://docs.ar.io/sdks/turbo-sdk/) credits / crypto top-up.
2. Keep a buffer above free-tier limits for cover + ciphertext + ACE metadata (and later envelope / edition JSON).
3. Rotate JWK by generating a new keypair, funding it, updating Vercel Preview/Production secrets, then retiring the old key.
4. Smoke:

```bash
cd apps/web
PERMANENT_STORAGE_BACKEND=arweave ARWEAVE_JWK='…' pnpm smoke:arweave-turbo
```

## App size limits (reject before upload)

From `apps/web/src/lib/works/upload-limits.ts`:

| Payload | Max |
| --- | --- |
| Manuscript (pre-encrypt) | 32 MiB |
| Ciphertext | 32 MiB + 1 KiB |
| Cover image | 2 MiB (jpeg/png/webp) |

Oversized payloads fail validation in the upload API — they never hit Turbo.

## Rate limits

Defaults (overridable via env — see `apps/web/.env.example`):

| Scope | Default |
| --- | --- |
| IP (`works-upload`) | 10 requests / 60s |
| Wallet | 5 requests / 1h |

## Retry policy

Andromeda does **not** auto-retry Turbo uploads in-app (single attempt per blob).

Operator / author retry:

1. Confirm Turbo balance and gateway health (`curl` primary + failover gateway).
2. Re-submit publish from the author UI (new upload) — safe because failed publishes do not register on-chain.
3. For transient Turbo/network errors, wait briefly then retry; persistent `ArweaveUploadError` usually means credits, JWK, or payload size.

Read path (`ar://`) uses gateway failover (PR6). Write path failures surface as upload API errors.

## Metrics (logs)

Each Turbo upload emits structured JSON logs (`scope: ipfs.arweave`):

| Event | Level | Fields |
| --- | --- | --- |
| `turbo_upload_ok` | info | `backend`, `outcome`, `sizeBytes`, `durationMs`, optional `winc` |
| `turbo_upload_error` | error | same + `errorName` |

**Success rate:** `count(turbo_upload_ok) / (ok + error)` over a window in Vercel logs.

**Average cost:** mean of numeric `winc` on `turbo_upload_ok` (winston credits reported by Turbo).

No secrets, JWK material, or stack traces are logged.

## Legacy IPFS → Arweave migration (PR8)

**Decision:** work-level `metadataURI` is **not** left on IPFS forever. Authors
repaint the certificate with `updateWorkMetadataURI(workId, newURI)` (author-only,
emits `WorkMetadataUpdated`). Per-copy paths already use `setCopyMetadataURI` /
`setCopyEnvelopeURI`.

### Operator flow

1. Redeploy `AndromedaWorks` that includes `updateWorkMetadataURI` (Amoy/mainnet as needed).
2. Sync ABI: `pnpm --filter @andromeda/web sync:contract-abi`.
3. Ensure indexer is running so `WorkMetadataUpdated` updates Mongo `works.metadataURI`.
4. Run migration (uploads only; no chain txs):

```bash
cd apps/web
pnpm migrate:ipfs-arweave -- --work-id=1 --out=./migration-report.json
```

5. Author wallet submits txs from `suggestedOnChain` in the report:
   - `updateWorkMetadataURI`
   - `setCopyMetadataURI` / `setCopyEnvelopeURI` for still-`ipfs://` copies
6. Orphans (`status: "orphan"`) mean IPFS was unreachable — do not update on-chain for those blobs; keep dual-read for remaining `ipfs://` until recoverable or accepted as lost.

DoD check: after txs + indexer, `works(workId).metadataURI`, `tokenURI`, and
`envelopeURIOfToken` are `ar://…` and readable via gateway failover.

## Verify Preview DoD

1. Vercel Preview: `ARWEAVE_JWK` set; Pinata key unset or invalid.
2. Publish a work → `metadataURI` starts with `ar://`.
3. Fetch via gateway: `curl https://arweave.net/<txId>` returns ACE JSON.
4. Logs show `turbo_upload_ok` (not Pinata pin events).

## Production cutover (PR9)

Vercel **Production** secrets (critical for publish):

| Variable | Required |
| --- | --- |
| `PERMANENT_STORAGE_BACKEND` | `arweave` (also the code default) |
| `ARWEAVE_JWK` | yes |
| `ARWEAVE_GATEWAY_URLS` | recommended |
| `IPFS_PINNING_API_KEY` | **not** required for writes |

Pinata may remain configured only for legacy `ipfs://` reads. With Pinata unset,
Production publish must still succeed.

## Offline ACE reference reader (PR9)

With the Andromeda app / Mongo offline, a copy is still readable from chain + gateways:

```bash
cd apps/web
pnpm reference-reader -- \
  --rpc="$ALCHEMY_RPC_URL" \
  --contract="$NEXT_PUBLIC_CONTRACT_ADDRESS" \
  --token-id=10 \
  --signature=0x… \
  --chain=amoy
```

Sign the message `Andromeda reader key v1`. Discovery uses `tokenURI` +
`envelopeURIOfToken` (must be `ar://` unless `--allow-ipfs`).

## Continuity URI index (PR9)

Export a bootstrap index of work/token URIs and pin it on Arweave:

```bash
cd apps/web
pnpm export:continuity-index -- --out=./continuity-index.json   # optional local dump
pnpm export:continuity-index                                     # upload via Turbo
```

The index is a convenience for third-party bootstraps; the reference reader does
**not** require it when URIs are on-chain.

## Related docs

- Plan: [storage-indipendence.md](../plans/storage-indipendence.md) (PR7–PR9)
- Chain commands / smoke: [commands.md](../blockchain/commands.md)
- Env template: `apps/web/.env.example`
