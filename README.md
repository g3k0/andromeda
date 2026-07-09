# Andromeda

> A blockchain platform that empowers writers to share and sell their work.

Andromeda is a decentralized publishing platform that helps writers distribute
and monetize their creations. It leverages NFT technology to mint
author-certified copies of literary works that readers can **buy**, **read**,
and **collect**.

## Overview

Traditional digital publishing makes it hard for authors to prove ownership,
control distribution, and capture fair value from their work. Andromeda
addresses this by turning each published work into a verifiable on-chain asset.

Every copy of a work is issued as an NFT certified by its author. This gives
writers a transparent way to sell their work directly to readers, while readers
gain a genuine, ownable, and collectible edition of the texts they love.

## Key Features

- **Author-certified works** — Each work is cryptographically signed and
  certified by its author, guaranteeing authenticity and provenance.
- **NFT-based copies** — Individual copies are minted as NFTs that readers can
  purchase and truly own.
- **Read & collect** — Owners can read their copies and build a personal
  collection of editions.
- **Direct author-to-reader sales** — Writers sell their work directly to their
  audience, without intermediaries.
- **Transparent ownership** — Ownership and transfer history are recorded
  on-chain and publicly verifiable.

## How It Works

1. **Publish** — A writer uploads a work and certifies it as the author.
2. **Mint** — The platform mints NFT copies of the work, each tied to its
   author's certification.
3. **Sell** — Copies are listed for sale and made available to readers.
4. **Buy, Read & Collect** — Readers purchase copies, read them, and keep them
   as part of their collection.

## Content & NFT Flow

Andromeda separates **where the text lives** (off-chain, on IPFS) from
**what is recorded on-chain** (ownership and author certification). Third-party
marketplaces such as [OpenSea](https://opensea.io/) are used for discovery and
secondary trading — not for the primary minting flow.

### Roles of each layer

| Layer | Responsibility |
| --- | --- |
| **IPFS** | Stores the literary work and token metadata (title, author, cover, edition attributes). |
| **Andromeda** (smart contract + web app) | Author certification, limited-edition minting, primary sales, reading access, and platform administration. |
| **OpenSea** (optional) | Indexes ERC-721 tokens on Polygon and enables secondary-market trading between collectors. |

### End-to-end flow

```
Author uploads work + metadata
        │
        ▼
   IPFS (text + JSON metadata)
        │
        ▼
registerWork(metadataURI, price, maxCopies)   ← author certifies the work on-chain
        │
        ▼
Readers buy via Andromeda: mintCopy(workId)   ← one NFT per copy (e.g. 100 editions)
        │
        ├──► Andromeda web app — read, collect, manage library
        │
        └──► OpenSea — list and resell owned copies (secondary market)
```

### What goes on IPFS

Two distinct assets are stored off-chain:

1. **Work content** — the text of the literary work (or an encrypted file
   accessible only to token holders).
2. **Token metadata** — a JSON document compatible with the
   [OpenSea metadata standard](https://docs.opensea.io/docs/metadata-standards),
   referenced by the on-chain `metadataURI`.

Example metadata for a numbered edition:

```json
{
  "name": "Short Story — Copy #7/100",
  "description": "Author-certified edition.",
  "image": "ipfs://…cover…",
  "external_url": "https://andromeda.example/read/…",
  "attributes": [
    { "trait_type": "Author", "value": "Jane Doe" },
    { "trait_type": "Copy", "value": "7" },
    { "trait_type": "Edition", "value": "100" },
    { "trait_type": "Content", "value": "ipfs://…text…" }
  ]
}
```

OpenSea reads this JSON to display the token name, image, traits, and links.
Andromeda uses the content pointer to grant read access to owners.

### Why mint on Andromeda, not on OpenSea

Creator tools on OpenSea (e.g. OpenSea Studio) can mint simple collections,
but they do not provide the publishing model Andromeda needs:

- on-chain **author certification** (`registerWork` sets the caller as author);
- **limited editions** with an on-chain copy counter (`maxCopies`, `minted`);
- **direct payment to the author** on each primary sale;
- integrated **reading and collection** experience on the Andromeda platform.

Minting happens through the `AndromedaWorks` ERC-721 contract on Polygon.
OpenSea is used **after** minting, when collectors want visibility or wish to
resell a copy they already own.

### Numbered editions

The `AndromedaWorks` contract supports a maximum number of copies per work
(e.g. `maxCopies = 100`). Each minted copy can carry its own metadata so that
OpenSea and wallets display distinct edition numbers (Copy #1/100, #2/100, …).
After a copy is minted, its owner pins a per-token metadata JSON — identical to
the work metadata plus `Copy number` / `Edition size` attributes — and points
the token's on-chain `tokenURI` at it via `setCopyMetadataURI(tokenId, uri)`.
The shared ciphertext and per-token envelope are unchanged, so numbering never
affects the encryption model. See [`documentation/ace-v1.md`](documentation/ace-v1.md).

### What Andromeda owns vs. what OpenSea provides

| Capability | Andromeda | OpenSea |
| --- | :---: | :---: |
| IPFS upload & pinning workflow | ✓ | |
| Author certification | ✓ | |
| Primary sale (mint + pay author) | ✓ | |
| Read access for token holders | ✓ | |
| Platform admin & curation | ✓ | |
| Secondary-market listing & trading | | ✓ |
| Discovery for NFT collectors | | ✓ |

## Web3 layer (blockchain + IPFS)

The Web3 layer connects `apps/web` to Polygon, the `AndromedaWorks` ERC-721
contract, ERC-6551 token bound accounts, and IPFS. Reading is protected by a
**technical paywall**: metadata is public, the work text is encrypted, and each
copy carries a per-token *envelope* that only its owner can unwrap in the
browser. The server never custodies keys or streams plaintext.

- **Architecture & rationale:** [documentation/plans/web3-layer-architecture.md](documentation/plans/web3-layer-architecture.md)
- **ACE v1 encryption spec (for third-party readers):** [documentation/ace-v1.md](documentation/ace-v1.md)

**Content flow:** author encrypts the work once with a random key `K`
(AES-256-GCM) → ciphertext pinned to IPFS → `K` wrapped (ECIES/secp256k1) per
token into an envelope → owner signs a message to derive their reading key,
unwraps the envelope, and decrypts locally. Off-chain reads (catalog, library)
are served from a MongoDB projection kept in sync by a chain indexer (polling
and/or Alchemy Notify webhook).

## Tech Stack

- **Frontend & Admin** — [Next.js](https://nextjs.org/) (App Router) + TypeScript
  + [Tailwind CSS](https://tailwindcss.com/), deployed on
  [Vercel](https://vercel.com/). A single app serves both the public reader
  experience and a wallet-gated `/admin` area.
- **Web3 client** — [wagmi](https://wagmi.sh/) + [viem](https://viem.sh/) with
  MetaMask / WalletConnect connectors.
- **Blockchain** — [Polygon PoS](https://polygon.technology/) (mainnet) and
  Polygon Amoy (testnet), chosen for low transaction fees and a mature NFT
  ecosystem.
- **Smart contracts** — [Solidity](https://soliditylang.org/) +
  [OpenZeppelin](https://www.openzeppelin.com/contracts) (ERC-721), developed and
  tested with [Hardhat](https://hardhat.org/).
- **Monorepo** — [pnpm](https://pnpm.io/) workspaces.
- **Decentralized storage** — [IPFS](https://ipfs.tech/) for work content and
  token metadata; pinning via a provider such as Pinata or web3.storage.

## Project Structure

```
andromeda/
├── apps/
│   └── web/              # Next.js app (public site + protected /admin)
├── packages/
│   └── contracts/        # Hardhat project with the ERC-721 contract
├── documentation/        # Plans, DB commands, architecture notes
├── package.json          # workspace root scripts
└── pnpm-workspace.yaml
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/) >= 10

### Installation

```bash
pnpm install
```

### Build

All commands below are run from the repository root.

**Web app (Next.js)**

```bash
pnpm build    # production build
pnpm start    # run the production server (after build)
pnpm lint     # ESLint
pnpm web:test # unit tests (Vitest)
pnpm web:test:coverage   # unit tests with coverage report (80% threshold on covered web modules)
```

**Smart contracts (Hardhat)**

```bash
pnpm contracts:build          # compile Solidity contracts
pnpm contracts:test           # compile and run the test suite
pnpm contracts:deploy:amoy    # deploy to Polygon Amoy testnet
```

Equivalent commands scoped to a single package:

```bash
pnpm --filter @andromeda/web build
pnpm --filter @andromeda/web test
pnpm --filter @andromeda/web test:coverage
pnpm --filter @andromeda/contracts build
pnpm --filter @andromeda/contracts deploy:polygon   # deploy to Polygon mainnet
```

### Smart contracts

See [Build](#build) for compile, test, and deploy commands. Before deploying,
copy `packages/contracts/.env.example` to `packages/contracts/.env` and fill in
your RPC URL, deployer private key, and Polygonscan API key.

### Run locally

**Prerequisites:** Node.js 20, pnpm 10, [MongoDB](https://www.mongodb.com/) running locally
(`sudo systemctl start mongod` on Linux — see
[documentation/database/mongodb-commands.md](documentation/database/mongodb-commands.md)).

```bash
pnpm install

# Local secrets (gitignored)
cp apps/web/.env.example apps/web/.env.local
# or database only:
# cp apps/web/.env.development.local.example apps/web/.env.development.local
```

Set at least:

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string (server-only) |
| `ADMIN_ADDRESSES` | Comma-separated admin wallets (user bootstrap) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect (optional in dev) |
| `ALCHEMY_RPC_URL` | Alchemy JSON-RPC for server-side chain reads (server-only) |
| `NEXT_PUBLIC_ALCHEMY_RPC_URL` | Alchemy JSON-RPC for wagmi in the browser |

First-time database setup:

```bash
# See mongodb-commands.md for mongosh: createUser, indexes, etc.

# System roles (reader, author, admin) — required before using the app
pnpm --filter @andromeda/web exec tsx scripts/seed-roles.ts

# Bootstrap users from ADMIN_ADDRESSES, authors, and legacy preferences
pnpm --filter @andromeda/web exec tsx scripts/migrate-users.ts
```

Start the app:

```bash
pnpm dev    # http://localhost:3000
```

**Local admin:** connect a wallet listed in `ADMIN_ADDRESSES`, open `/admin` →
*Manage users and roles* (`/admin/users`, `/admin/roles`). Admin mutations use a
server-side wallet session (signature only on first access).

#### Environment configuration

The web app uses [Next.js environment files](https://nextjs.org/docs/app/guides/environment-variables)
in `apps/web/`. Next.js sets `NODE_ENV` automatically; you do not need to export it locally.

| Environment | Command | `NODE_ENV` (set by Next.js) | Files loaded |
| --- | --- | --- | --- |
| **Local** | `pnpm dev` | `development` (default when unset) | `.env.development`, then `.env.local` / `.env.development.local` |
| **Production** | `pnpm build` / `pnpm start` / Vercel deploy | `production` | `.env.production`, then `.env.production.local` |
| **Tests** | `pnpm web:test` | `test` | `.env.test` |

- **Committed defaults** (no secrets): [`.env.development`](apps/web/.env.development) (Amoy testnet),
  [`.env.production`](apps/web/.env.production) (Polygon mainnet).
- **Local secrets** (gitignored): `.env.local` or `.env.development.local` — copy from
  [`.env.example`](apps/web/.env.example) or [`.env.development.local.example`](apps/web/.env.development.local.example).
- **Production secrets**: set in Vercel **Settings → Environment Variables** (never in the repo).
- **Personal reference**: optional `secrets.md` at the repo root (also gitignored).

Set `NEXT_PUBLIC_CONTRACT_ADDRESS` to the deployed contract address when testing on-chain
features. Prefer `ADMIN_ADDRESSES` (server-only) for platform admins; `NEXT_PUBLIC_ADMIN_ADDRESSES`
is legacy.

For Web3 features, create [Alchemy](https://www.alchemy.com/) apps for Polygon Amoy (local dev) and
Polygon mainnet (production), then set `ALCHEMY_RPC_URL` and `NEXT_PUBLIC_ALCHEMY_RPC_URL` in
`.env.local` or Vercel. See [documentation/plans/web3-layer-architecture.md](documentation/plans/web3-layer-architecture.md).

#### Unit tests

Web unit tests use [Vitest](https://vitest.dev/) and live under `apps/web/src/**/*.test.ts`.
Run them from the repository root (there is no root-level `pnpm test` script):

```bash
pnpm web:test              # run once
pnpm web:test:coverage     # run with coverage (enforces 80% on covered author/auth modules)
```

From `apps/web` you can also run:

```bash
cd apps/web
pnpm test                  # run once
pnpm test:watch            # re-run on file changes
pnpm test:coverage         # run with coverage
```

Smart contract tests are separate: `pnpm contracts:test` (Hardhat).

#### Continuous integration

Pull requests and pushes to `develop` and `main` run the [CI workflow](.github/workflows/ci.yml)
(GitHub Actions) on Node 20: lint, typecheck, React Doctor (on the diff), web unit tests with
coverage, web build, dependency audit, and the smart-contract compile (`contracts:build`).

#### MongoDB & platform data

Persistence via Mongoose (`apps/web/src/lib/db/*`). Mutations require a **wallet signature**
(EIP-191) or an **admin session** cookie; authorization is always enforced server-side.

| Collection | Content |
| --- | --- |
| `roles` | System/custom roles and permission subsets |
| `users` | Wallet identity, `roleSlug`, status, preferences |
| `authors` | Public author profiles |
| `wallet_sessions` | Admin sessions with permission snapshots |

**Main routes**

| Route | Purpose |
| --- | --- |
| `/author`, `/author/[address]` | Author profile and onboarding |
| `/admin` | Admin dashboard (wallet + `admin:access` permission) |
| `/admin/users`, `/admin/roles` | User and role management |

**Roles:** stored in `roles`; each user references one via `users.roleSlug`. Seed roles are
`reader`, `author`, `admin`. Effective permissions come from the role document (+ optional overrides).

**Further reading**

- [documentation/database/mongodb-commands.md](documentation/database/mongodb-commands.md) — DB setup, role seed, referential integrity
- [documentation/plans/author-page.md](documentation/plans/author-page.md) — author pages
- [documentation/plans/roles.md](documentation/plans/roles.md) — roles and permissions
- [documentation/plans/db-integration.md](documentation/plans/db-integration.md) — DB architecture

### Deployment (Vercel)

The web app is deployed on [Vercel](https://vercel.com/). The Next.js app in
`apps/web` is self-contained (it does not import other workspace packages), so
Vercel installs dependencies directly inside `apps/web` with npm.

#### Project settings

In **Settings → General** and **Settings → Build & Deployment**:

| Setting | Value |
| --- | --- |
| **Root Directory** | `apps/web` |
| **Framework Preset** | Next.js |
| **Install Command** | Override **off** (uses [`apps/web/vercel.json`](apps/web/vercel.json)) |
| **Build Command** | Override **off** (uses [`apps/web/vercel.json`](apps/web/vercel.json)) |

[`apps/web/vercel.json`](apps/web/vercel.json) runs:

```bash
npm install --legacy-peer-deps
next build
```

**Include source files outside of Root Directory** is not required for deploy
(the web app has no workspace dependencies), but enabling it does not hurt.

If deploys fail with *No Next.js version detected*, check that:

- **Root Directory** is exactly `apps/web`
- Install Command and Build Command overrides are **disabled** in the dashboard

If the build succeeds but deploy fails with a duplicated path such as
`/vercel/path0/vercel/path0/.next/routes-manifest.json`, do **not** set
`outputFileTracingRoot` in `next.config.mjs` when the Vercel root is `apps/web`
(the app has no workspace dependencies). Remove that option and redeploy.

Add the `NEXT_PUBLIC_*` environment variables from `apps/web/.env.example` in
**Settings → Environment Variables** (Production for `main`, Preview for
`develop` and pull requests).

#### Production environment checklist (Vercel)

Set these in **Settings → Environment Variables**. Public (`NEXT_PUBLIC_*`)
values are exposed to the browser; server-only values must **never** be prefixed
with `NEXT_PUBLIC_`. Rotate provider keys from their dashboards, not in the repo.

**Chain & contract**

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_CHAIN` | public | Target chain: `polygon` (mainnet) or `amoy` (testnet) |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | public | Deployed `AndromedaWorks` ERC-721 address |
| `ALCHEMY_RPC_URL` | server | Alchemy JSON-RPC for indexer / public client / read-access |
| `NEXT_PUBLIC_ALCHEMY_RPC_URL` | public | Alchemy JSON-RPC for wagmi in the browser |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | public | WalletConnect Cloud project id |

**ERC-6551 (token bound accounts)**

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_ERC6551_REGISTRY` | public | Registry address (defaults to Tokenbound v0.3.1 canonical) |
| `NEXT_PUBLIC_ERC6551_IMPLEMENTATION` | public | Account proxy address (defaults to Tokenbound v0.3.1) |

**IPFS (Pinata / gateway)**

| Variable | Scope | Purpose |
| --- | --- | --- |
| `IPFS_PINNING_API_KEY` | server | Pinning provider API key (Pinata or compatible) |
| `IPFS_GATEWAY_BASE_URL` | server | Gateway base URL for server-side fetches |
| `NEXT_PUBLIC_IPFS_GATEWAY_BASE_URL` | public | Gateway base URL for browser fetches |

**Indexer & platform data**

| Variable | Scope | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | server | MongoDB connection string (off-chain projection) |
| `CHAIN_INDEXER_ENABLED` | server | Enable the polling chain indexer (`true`/`false`) |
| `CHAIN_INDEXER_START_BLOCK` | server | Optional first block to index from |
| `ALCHEMY_NOTIFY_SIGNING_KEY` | server | HMAC signing key to verify Alchemy Notify webhooks |
| `ADMIN_ADDRESSES` | server | Comma-separated admin wallets (bootstrap) |

Use **separate Alchemy apps** and **separate contract addresses** for Preview
(Amoy) and Production (Polygon mainnet).

## Roadmap

- [x] Core smart contracts for minting and certifying works
- [x] IPFS upload workflow for work content and metadata
- [x] Author publishing flow
- [x] Per-copy metadata for numbered editions
- [x] Reader marketplace and library
- [x] In-app reading experience (client-side ACE decryption)
- [ ] OpenSea integration for secondary-market visibility

## Contributing

Contributions are welcome. Please open an issue to discuss significant changes
before submitting a pull request.

## License

This project is open source and released under the [MIT License](LICENSE).
