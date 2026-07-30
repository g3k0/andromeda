# Comandi blockchain (Andromeda)

Riferimento operativo per interagire con il layer Web3 del monorepo: contratto
`AndromedaWorks` (Hardhat), RPC Alchemy (Polygon / Amoy), ABI e chain reader in
`apps/web`.

Per l’architettura completa vedi
[documentation/plans/web3-layer-architecture.md](../plans/web3-layer-architecture.md).

Esegui i comandi **dalla root del repository** (`andromeda/`), salvo dove indicato.

---

## Prerequisiti

| Requisito | Note |
| --- | --- |
| Node.js 20, pnpm 10 | Vedi `package.json` |
| Wallet con MATIC | Solo per deploy/testnet o mainnet (Amoy: faucet testnet) |
| App Alchemy | RPC per Amoy (dev) e/o Polygon mainnet (prod) |
| `.env` configurati | Segreti **mai** committati |

---

## Variabili d’ambiente

### Web app (`apps/web`)

Copia il template e compila i secret in un file gitignored:

```bash
cp apps/web/.env.example apps/web/.env.local
```

| Variabile | Scope | Uso |
| --- | --- | --- |
| `NEXT_PUBLIC_CHAIN` | Client | `amoy` (testnet) o `polygon` (mainnet) |
| `ALCHEMY_RPC_URL` | Server | RPC Alchemy per `createAndromedaPublicClient()` e letture viem |
| `NEXT_PUBLIC_ALCHEMY_RPC_URL` | Client | RPC Alchemy per wagmi nel browser |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Client | Indirizzo del contratto `AndromedaWorks` **deployato** sulla rete scelta |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Client | WalletConnect (connessione wallet) |
| `PERMANENT_STORAGE_BACKEND` | Server | `arweave` (default) o `pinata` (legacy opt-in). Su Vercel Preview è sempre `arweave`. |
| `IPFS_PINNING_API_KEY` | Server | JWT Pinata — solo se il backend write è esplicitamente `pinata` (non Preview) |
| `IPFS_GATEWAY_BASE_URL` / `NEXT_PUBLIC_IPFS_GATEWAY_BASE_URL` | Server / Client | Gateway HTTP per URI `ipfs://` legacy |
| `ARWEAVE_JWK` / `ARWEAVE_TURBO_JWK` | Server | JWK Arweave (JSON) per autenticare Turbo — richiesto con backend `arweave` / Preview |
| `ARWEAVE_GATEWAY_URLS` | Server | Lista failover gateway `ar://` (comma-separated) |
| `ARWEAVE_GATEWAY_BASE_URL` / `NEXT_PUBLIC_ARWEAVE_GATEWAY_BASE_URL` | Server / Client | Gateway HTTP primario per URI `ar://` |

Storage permanente: vedi [storage-indipendence.md](../plans/storage-indipendence.md)
e il runbook [arweave-runbook.md](../ops/arweave-runbook.md).
`getPermanentStorage()` alimenta il publish path (`POST /api/works/upload`).
**Default e Preview:** `arweave` + `ARWEAVE_JWK` + gateway Arweave.
`pinata` resta disponibile solo come opt-in legacy fuori da Preview.

Smoke Turbo (richiede crediti + JWK reale):

```bash
cd apps/web
PERMANENT_STORAGE_BACKEND=arweave ARWEAVE_JWK='…' pnpm smoke:arweave-turbo
```

Smoke publish → `registerWork(ar://…)` su Amoy (manuale):

1. Imposta Preview/local: `ARWEAVE_JWK` (backend default `arweave`),
   `NEXT_PUBLIC_CHAIN=amoy`, `NEXT_PUBLIC_CONTRACT_ADDRESS`.
2. Pubblica un’opera dall’UI author (upload cifra → API → `metadataUri` `ar://…`).
3. Conferma su Polygonscan Amoy che `registerWork` riceve `metadataURI` che inizia con `ar://`.
4. `curl https://arweave.net/<txId>` (o il gateway configurato) deve restituire JSON ACE
   con `image` / `ace.encrypted_content` in `ar://`.

Nota: edition metadata ed envelope usano lo stesso permanent storage (`ar://` + URI on-chain).
Operazioni Turbo/crediti/retry: [arweave-runbook.md](../ops/arweave-runbook.md).

`NEXT_PUBLIC_CONTRACT_ADDRESS` serve solo **dopo** un deploy reale. Senza deploy,
i test del chain reader funzionano ugualmente (fake in-memory / mock viem).

### Hardhat (`packages/contracts`)

```bash
cp packages/contracts/.env.example packages/contracts/.env
```

| Variabile | Uso |
| --- | --- |
| `AMOY_RPC_URL` | RPC per deploy e script su Polygon Amoy |
| `POLYGON_RPC_URL` | RPC per deploy su Polygon mainnet |
| `PRIVATE_KEY` | Chiave del wallet deployer (**solo locale**, mai in git) |
| `POLYGONSCAN_API_KEY` | Verifica contratto su Polygonscan (opzionale) |

---

## Contratti intelligenti (`packages/contracts`)

Comandi esposti dalla root del monorepo:

| Comando | Descrizione |
| --- | --- |
| `pnpm contracts:build` | Compila i contratti Solidity (`hardhat compile`). Genera `artifacts/` e `typechain-types/` (gitignored). |
| `pnpm contracts:test` | Compila ed esegue la suite Hardhat (`AndromedaWorks.test.ts`, test reentrancy, …). |
| `pnpm contracts:deploy:amoy` | Deploy di `AndromedaWorks` su **Polygon Amoy** (testnet). |

Comandi aggiuntivi sul package (equivalenti o non aliasati in root):

| Comando | Descrizione |
| --- | --- |
| `pnpm --filter @andromeda/contracts build` | Come `contracts:build` |
| `pnpm --filter @andromeda/contracts test` | Come `contracts:test` |
| `pnpm --filter @andromeda/contracts node` | Avvia un nodo Hardhat locale in memoria (chain `31337`, utile per prove rapide senza Amoy). |
| `pnpm --filter @andromeda/contracts deploy:amoy` | Come `contracts:deploy:amoy` |
| `pnpm --filter @andromeda/contracts deploy:polygon` | Deploy su **Polygon mainnet** — usare solo quando si è pronti per produzione. |

### Deploy su Amoy (prima volta)

1. Compila:

   ```bash
   pnpm contracts:build
   ```

2. Configura `packages/contracts/.env` (`PRIVATE_KEY`, `AMOY_RPC_URL`).

3. Deploy:

   ```bash
   pnpm contracts:deploy:amoy
   ```

4. Copia l’indirizzo stampato (`AndromedaWorks deployed at: 0x…`) in
   `apps/web/.env.local`:

   ```env
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
   NEXT_PUBLIC_CHAIN=amoy
   ```

5. Verifica su [Polygonscan Amoy](https://amoy.polygonscan.com/) che l’indirizzo
   mostri bytecode e almeno la transazione di deploy.

### Dopo modifiche al contratto Solidity

```bash
pnpm contracts:build
pnpm contracts:test
pnpm --filter @andromeda/web sync:contract-abi   # aggiorna ABI in apps/web
pnpm contracts:deploy:amoy                         # nuovo deploy → nuovo indirizzo
```

Ogni redeploy produce un **nuovo** indirizzo: aggiorna `NEXT_PUBLIC_CONTRACT_ADDRESS`.

### Link utili

[Faucet](https://faucet.polygon.technology/) rete amoy per ottenere MATIC di test

---

## Layer Web3 in `apps/web`

Moduli principali: `apps/web/src/lib/chain/` (RPC, ABI, chain reader, adapter viem).

| Comando | Descrizione |
| --- | --- |
| `pnpm --filter @andromeda/web sync:contract-abi` | Copia l’ABI da `packages/contracts/artifacts/.../AndromedaWorks.json` in `src/lib/chain/andromeda-works.abi.json`. Richiede `pnpm contracts:build` eseguito almeno una volta. |
| `pnpm web:test` | Tutti i test Vitest del web (include il layer chain). |
| `pnpm web:test:coverage` | Test con coverage (soglia ≥ 80% sulle aree incluse in `vitest.config.ts`). |
| `pnpm --filter @andromeda/web test src/lib/chain/` | Solo test del layer blockchain (RPC, ABI, chain reader, fake in-memory, adapter viem). |
| `pnpm typecheck` | Typecheck TypeScript del web (include `lib/chain`). |
| `pnpm lint` | ESLint del web. |

Da `apps/web`:

| Comando | Descrizione |
| --- | --- |
| `pnpm test:watch` | Vitest in modalità watch |
| `pnpm sync:contract-abi` | Come sopra, scoped al package web |

### Verifica locale senza deploy

Il chain reader (PR 2) **non richiede** un contratto on-chain per essere validato:

```bash
pnpm --filter @andromeda/web test src/lib/chain/
```

I test usano fake in-memory e mock di `readContract`; nessun RPC reale né MongoDB.

### Verifica con chain reale (opzionale)

Richiede:

- `ALCHEMY_RPC_URL` e `NEXT_PUBLIC_ALCHEMY_RPC_URL` in `.env.local`
- `NEXT_PUBLIC_CONTRACT_ADDRESS` = indirizzo del **tuo** deploy su Amoy
- `NEXT_PUBLIC_CHAIN=amoy`

Non esiste ancora uno script CLI dedicato nel repo; dopo il deploy puoi controllare
manualmente su Polygonscan Amoy (`totalWorks`, transazioni `registerWork` / `mintCopy`)
o integrare letture via `createViemChainReader` + `createAndromedaPublicClient()` nel
codice applicativo (catalogo e indexer: PR successive del piano Web3).

---

## Flussi di lavoro tipici

### Sviluppo app (auth, UI) senza blockchain live

```bash
pnpm dev
```

Alchemy e indirizzo contratto possono restare vuoti se non stai testando wagmi/chain.
I test del dominio chain restano eseguibili offline.

### Sviluppo layer Web3 (chain reader, RPC)

```bash
pnpm contracts:build
pnpm --filter @andromeda/web sync:contract-abi
pnpm --filter @andromeda/web test src/lib/chain/
pnpm web:test:coverage
```

### Primo collegamento end-to-end a Amoy

```bash
# 1. Contratto
pnpm contracts:build
pnpm contracts:deploy:amoy

# 2. Web env (indirizzo deploy + Alchemy)
#    apps/web/.env.local

# 3. ABI allineata
pnpm --filter @andromeda/web sync:contract-abi

# 4. Test
pnpm --filter @andromeda/web test src/lib/chain/
pnpm dev
```

---

## Reti supportate

| Rete | Chain ID | Env web | Deploy Hardhat |
| --- | --- | --- | --- |
| Polygon Amoy (testnet) | 80002 | `NEXT_PUBLIC_CHAIN=amoy` | `deploy:amoy` |
| Polygon PoS (mainnet) | 137 | `NEXT_PUBLIC_CHAIN=polygon` | `deploy:polygon` |
| Hardhat local | 31337 | Non usato da wagmi di default | `pnpm --filter @andromeda/contracts node` + deploy manuale verso localhost |

L’indirizzo del contratto è **specifico per rete**: un deploy su Amoy non vale su mainnet.

---

## Explorer e risorse

| Risorsa | URL |
| --- | --- |
| Polygonscan Amoy | https://amoy.polygonscan.com/ |
| Polygonscan mainnet | https://polygonscan.com/ |
| Alchemy dashboard | https://dashboard.alchemy.com/ |
| Faucet Amoy | Cercare “Polygon Amoy faucet” per MATIC test |

---

## Cosa non copre ancora questo documento

Funzionalità pianificate ma non ancora esposte come comandi CLI (vedi piano Web3):

- publish autore → IPFS + `registerWork` (PR 6)
- mint copia + envelope TBA (PR 7)
- indexer eventi → MongoDB (PR 8)
- webhook Alchemy Notify (PR 10)

Quando verranno aggiunti script o comandi npm dedicati, vanno documentati in questa pagina.
