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
- [ ] Author publishing flow
- [ ] Reader marketplace and library
- [ ] In-app reading experience
- [ ] Collection and resale support

## Contributing

Contributions are welcome. Please open an issue to discuss significant changes
before submitting a pull request.

## License

This project is open source and released under the [MIT License](LICENSE).
