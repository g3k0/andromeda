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

### Numbered editions (current state & next step)

The `AndromedaWorks` contract supports a maximum number of copies per work
(e.g. `maxCopies = 100`). Today, every minted copy shares the same
`metadataURI` registered with the work. To display distinct edition numbers
on OpenSea and in wallets (Copy #1/100, #2/100, …), the contract will be
extended so each token receives metadata that includes its copy number — either
as a dedicated IPFS file per token or via a dynamic metadata endpoint keyed by
`tokenId`.

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
│   └── web/          # Next.js app (public site + protected /admin)
├── packages/
│   └── contracts/    # Hardhat project with the ERC-721 contract
├── package.json      # workspace root scripts
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

### Web app

```bash
# Copy and configure local secrets (required for MongoDB and other credentials)
cp apps/web/.env.example apps/web/.env.local
# Or only database credentials:
# cp apps/web/.env.development.local.example apps/web/.env.development.local

# Start the dev server (http://localhost:3000)
pnpm dev
```

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

Set `NEXT_PUBLIC_CONTRACT_ADDRESS` to the deployed contract address and add the
authorized admin wallet(s) to `NEXT_PUBLIC_ADMIN_ADDRESSES`.

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
(GitHub Actions). It currently runs web unit tests with coverage. More steps (lint, build,
contract tests, and so on) can be added to that workflow over time.

#### Author pages (mock implementation)

Author profiles and onboarding are implemented in the web app with a **browser-only mock**
(`apps/web/src/lib/authors/mock-store.ts`). There is no database or API backend for profiles yet.

**Routes**

| Route | Purpose |
| --- | --- |
| `/author` | Resolves the connected wallet to `/author/[address]`, onboarding, or reader mode |
| `/author/[address]` | Public profile view; edit mode for the profile owner or platform admin |

**User roles** (cumulative capabilities)

| Role | How it is determined |
| --- | --- |
| **Reader** | Connected wallet without an author profile, or the user declined page creation |
| **Author** | Connected wallet with a created author profile |
| **Admin** | Wallet listed in `NEXT_PUBLIC_ADMIN_ADDRESSES` (full reader + author + edit any profile + `/admin`) |

On first connect, users without a profile are prompted to create an author page. If they decline,
`declinedAuthorPage` is stored in `localStorage` and they remain in reader mode.

**Mock limitations**

- Profiles and preferences persist in `localStorage` only (keys in `storage-keys.ts`).
- Data does not sync across browsers or devices; clearing site data removes it.
- Avatar uploads are stored as data URLs in the mock store, not on IPFS or object storage.
- Programmatic reference: `mock-limitations.ts` (also covered by unit tests).

**Planned database step** (not implemented)

- Tables: `authors`, `wallet_preferences`
- API: `GET /authors/:address`, `POST /authors`, `PATCH /authors/:address` (owner signature or server-verified admin)
- Replace `mock-store.ts`; keep `roles.ts`, `lib/auth/admin.ts`, and UI components

See [documentation/plans/author-page.md](documentation/plans/author-page.md) for the full implementation plan.

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

Add the `NEXT_PUBLIC_*` environment variables from `apps/web/.env.example` in
**Settings → Environment Variables** (Production for `main`, Preview for
`develop` and pull requests).

## Roadmap

- [x] Core smart contracts for minting and certifying works
- [ ] IPFS upload workflow for work content and metadata
- [ ] Author publishing flow
- [ ] Per-copy metadata for numbered editions
- [ ] Reader marketplace and library
- [ ] In-app reading experience
- [ ] OpenSea integration for secondary-market visibility

## Contributing

Contributions are welcome. Please open an issue to discuss significant changes
before submitting a pull request.

## License

This project is open source and released under the [MIT License](LICENSE).
