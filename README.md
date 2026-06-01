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

### Smart contracts

```bash
# Compile and run the test suite
pnpm contracts:build
pnpm contracts:test

# Deploy to Polygon Amoy testnet (configure packages/contracts/.env first)
pnpm contracts:deploy:amoy
```

Copy `packages/contracts/.env.example` to `packages/contracts/.env` and fill in
your RPC URL, deployer private key, and Polygonscan API key before deploying.

### Web app

```bash
# Copy and configure environment variables
cp apps/web/.env.example apps/web/.env.local

# Start the dev server (http://localhost:3000)
pnpm dev
```

Set `NEXT_PUBLIC_CONTRACT_ADDRESS` to the deployed contract address and add the
authorized admin wallet(s) to `NEXT_PUBLIC_ADMIN_ADDRESSES`.

### Deployment

The web app is deployed on Vercel. Point the project root to `apps/web` (or use
the root with the `dev`/`build` workspace scripts) and configure the
`NEXT_PUBLIC_*` environment variables in the Vercel dashboard.

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
