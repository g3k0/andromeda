# Piano: migrazione storage Pinata → Arweave

Implementazione incrementale per **sostituire Pinata/IPFS** con **Arweave** come storage
permanente delle opere Andromeda. Ogni commit è un’unità reviewabile; i commit sono
raggruppati in **PR** sequenziali.

Riferimenti: [ace-v1.md](../ace-v1.md), [web3-layer-architecture.md](./web3-layer-architecture.md),
[catalog.md](./catalog.md), [README](../../README.md).

---

## Principio di prodotto (vincolante)

> **Copia on-chain = proprietà + puntatore permanente al contenuto.**
>
> Chi possiede il token ERC-721 deve poter recuperare cover, metadata ACE, ciphertext ed
> envelope **senza** dipendere da Pinata, da un nodo Kubo Andromeda o dalla disponibilità
> dell’app. Il certificato on-chain punta a **URI Arweave** (`ar://…`) immutabili.

| Affermazione | Implicazione |
| --- | --- |
| L’opera è **sua** | Ownership sul contratto Polygon (`ownerOf`, transfer) |
| Contenuto **permanente** | Blob pagati una volta e conservati su Arweave |
| Certificato **punta ad Arweave** | `works.metadataURI`, `tokenURI`, envelope URI = `ar://<txId>` |
| Indipendente dalla **piattaforma** | Reader ACE: RPC chain + gateway Arweave + wallet |

**Perché Arweave (e non Kubo/IPFS self-hosted):** permanenza economica (pay-once), nessun
operatore Andromeda obbligatorio per tenere acceso il pinset, ecosistema NFT maturo con
`ar://`, gateway pubblici ar.io.

---

## Obiettivo

1. **Nuove pubblicazioni** caricano cover, ciphertext, metadata ACE, metadata per-copia ed
   envelope su **Arweave** (via Turbo / bundler).
2. **On-chain** salva URI `ar://…` (non più `ipfs://…` / CID Pinata).
3. **Lettura** risolve `ar://` tramite gateway Arweave (failover).
4. **Opere legacy** (IPFS/Pinata) restano leggibili in fase di transizione; migrazione
   opzionale con re-upload + aggiornamento URI on-chain dove consentito.
5. **Pinata** deprecato e rimosso dal path critico dopo cutover.
6. **Documentazione tecnica** (README, ACE, comandi, `.env.example`, piani correlati)
   aggiornata in modo coerente con Arweave.

---

## Stato attuale vs target

| Aspetto | Oggi (Pinata / IPFS) | Target (Arweave) |
| --- | --- | --- |
| Upload | `IpfsStoragePort` → Pinata `pinJSON`/`pinFile` | `PermanentStoragePort` → Turbo/Arweave upload |
| Identificatore | CID (`bafy…`) | Transaction / data item ID Arweave |
| URI canonico | `ipfs://<cid>` | **`ar://<txId>`** |
| On-chain `metadataURI` / `tokenURI` | `ipfs://…` | **`ar://…`** |
| Envelope | CID in Mongo (`envelopeCid`) | **`ar://…` on-chain** (+ cache Mongo) |
| ACE schema | Solo `ipfs://` (Zod) | `ar://` normativo; `ipfs://` legacy in lettura |
| Gateway | `gateway.pinata.cloud` | `arweave.net` / gateway ar.io (lista failover) |
| Longevità se Andromeda chiude | Dipende dal pinset Pinata/Kubo | Dati su Arweave; discovery da chain |

---

## Decisioni di prodotto (vincolanti)

| Decisione | Scelta | Motivazione |
| --- | --- | --- |
| **Storage primario** | **Arweave** | Permanenza; allinea al principio “sempre accessibile” |
| **Upload path** | **Turbo SDK** (`@ardrive/turbo-sdk`) server-side | DX, retry, pagamenti (credits / crypto); free tier piccoli blob |
| **URI on-chain** | Prefisso **`ar://`** (non HTTPS gateway hardcodati) | Future-proof; qualsiasi gateway può risolvere |
| **Pagamento upload** | Wallet / credits **Andromeda** (server) in v1; opzione “autore paga” in v2 | UX publish senza wallet Arweave per l’autore |
| **Contratto Solidity** | `metadataURI` resta `string` — **nessun cambio obbligatorio** al tipo | Già può contenere `ar://…` |
| **Envelope on-chain** | Nuovo `envelopeURIOfToken` + `setCopyEnvelopeURI` (come già previsto per longevità) | Discovery senza Mongo |
| **ACE** | Major/minor doc: URI content = `ar://` (o schema unione `ar://` \| `ipfs://` legacy) | Spec terza parte aggiornata |
| **Pinata** | Solo fallback lettura legacy fino a sunset | Nessun nuovo pin Pinata dopo cutover |
| **IPFS Kubo** | **Fuori scope** di questo piano | Sostituito da Arweave |

### Come il certificato punta ad Arweave

```
registerWork(metadataURI = "ar://<metadataTxId>", price, maxCopies)
        │
        ├─ works[workId].metadataURI  ──────────────► JSON ACE su Arweave
        │         │
        │         ├─ image:              ar://<coverTxId>
        │         └─ ace.encrypted_content: ar://<ciphertextTxId>
        │
        └─ mint copie → tokenURI iniziale = metadataURI (o setCopyMetadataURI)
                  │
                  ├─ tokenURI(tokenId) = "ar://<copyMetadataTxId>"  (edizione numerata)
                  └─ envelopeURIOfToken(tokenId) = "ar://<envelopeTxId>"
```

Un reader esterno, con solo RPC Polygon:

1. `tokenURI(tokenId)` → `ar://…` → fetch JSON ACE  
2. `ace.encrypted_content` → ciphertext  
3. `envelopeURIOfToken(tokenId)` → envelope  
4. Firma `Andromeda reader key v1` → decrypt  

**Nessuna API Andromeda richiesta.**

---

## Architettura target

```
  Publish / edition / envelope API
              │
              ▼
  ┌─────────────────────────────┐
  │  PermanentStoragePort       │  (ex IpfsStoragePort)
  │  uploadBlob · uploadJson    │
  │  toGatewayUrl · fetchBytes? │
  └─────────────┬───────────────┘
                │
       ┌────────▼────────┐
       │ ArweaveTurboAdapter │  ← @ardrive/turbo-sdk
       └────────┬────────┘
                │ data item / tx id
                ▼
         ar://<txId>  ──► on-chain metadataURI / tokenURI / envelopeURI
                │
                ▼
  ┌─────────────────────────────┐
  │ ArweaveGatewayResolver      │
  │ 1. ARWEAVE_GATEWAY_URLS[0]  │
  │ 2. failover ar.io / .net    │
  └─────────────────────────────┘
```

### Layering

```
UI / API → Zod + auth → publish / envelope / edition services
                              ↓
                   PermanentStoragePort (dominio)
                              ↓
              adapters: arweave-turbo | pinata-legacy (read-only) | in-memory
```

### Port (target)

```ts
/** Permanent content URI — Arweave canonical; IPFS only for legacy reads. */
export type ContentUri = `ar://${string}` | `ipfs://${string}`;

export type PermanentStoragePort = {
  uploadBlob(data: Uint8Array, options?: UploadOptions): Promise<UploadResult>;
  uploadJson(data: unknown, options?: UploadOptions): Promise<UploadResult>;
  toGatewayUrl(uri: ContentUri): string;
  fetchBytes?(uri: ContentUri): Promise<Uint8Array>;
};

export type UploadResult = {
  id: string;           // Arweave tx / data item id
  uri: `ar://${string}`;
  size: number;
};
```

Tag Turbo consigliati su ogni upload: `App-Name: Andromeda`, `Content-Type`,
`Work-Id` / `Token-Id` quando noti, `Andromeda-Kind: cover|content|metadata|envelope`.

---

## Variabili d’ambiente

| Variabile | Scope | Ruolo |
| --- | --- | --- |
| `PERMANENT_STORAGE_BACKEND` | server | `arweave` \| `pinata` (solo migrazione) |
| `ARWEAVE_TURBO_*` / JWK o key EVM | server | Auth Turbo (secret; mai `NEXT_PUBLIC_`) |
| `ARWEAVE_GATEWAY_URLS` | server (+ public mirror) | Lista failover per read |
| `NEXT_PUBLIC_ARWEAVE_GATEWAY_BASE_URL` | public | Gateway preferito browser |
| `IPFS_PINNING_API_KEY` | server | **Deprecato** post-cutover; solo legacy |
| `IPFS_GATEWAY_*` | — | Solo finché esistono URI `ipfs://` in prod |

---

## Flussi applicativi

### Publish (nuovo)

1. Encrypt in browser (`K` locale).  
2. `POST /api/works/upload` → `uploadBlob(cover)`, `uploadBlob(ciphertext)`, `uploadJson(ACE)` su Arweave.  
3. Persist `work_uploads` con `metadataURI = ar://…`, `contentId`, `coverId`.  
4. `registerWork(ar://metadataTxId, …)` on-chain.

### Edition metadata

1. Per ogni copia: `uploadJson(tokenMetadata)` → `ar://…`.  
2. `setCopyMetadataURI(tokenId, ar://…)`.

### Envelope

1. Pin/upload envelope → `ar://…`.  
2. Mongo cache + **`setCopyEnvelopeURI(tokenId, ar://…)`**.

### Read

1. Risolvi URI da chain (o Mongo projection).  
2. `ar://` → gateway Arweave; `ipfs://` legacy → gateway IPFS (finché supportato).  
3. Decrypt ACE invariato.

---

## Modello dati

| Campo | Cambio |
| --- | --- |
| `work_uploads.metadataURI` / `*Cid` | Rinominare semanticamente a `*Id` o accettare tx id Arweave; URI `ar://` |
| `works.metadataURI` | Valori `ar://…` |
| `works.encryptedContentCid` | → `encryptedContentUri` / id Arweave |
| `tokens.metadataURI` | `ar://…` |
| `tokens.envelopeCid` | → `envelopeURI` (`ar://…`), allineato a on-chain |
| Nuova collection `arweave_uploads` (opz.) | Audit: kind, txId, workId/tokenId, size, createdAt |

### Continuity (semplificata rispetto al piano Kubo)

Con Arweave non serve pinset self-hosted. Resta utile un **export periodico** dell’indice
(workId/tokenId → URI) pinnato su Arweave stesso, per bootstrap di reader terzi senza Mongo.

---

## Piano PR (sequenziale)

### PR 1 — Astrazione storage + tipi URI

**Obiettivo:** sganciamento nominale da Pinata senza cambiare comportamento.

| Commit | Contenuto |
| --- | --- |
| 1 | Introdurre `ContentUri` / `PermanentStoragePort` (alias o wrapper su `IpfsStoragePort`) |
| 2 | Factory `getPermanentStorage()` con `PERMANENT_STORAGE_BACKEND=pinata` default |
| 3 | Doc env; test factory |
| 4 | Gateway helper capace di `ar://` *e* `ipfs://` (stub ar per ora) |

**DoD:** prod invariata; coverage ≥ 80% nuovi moduli.

---

### PR 2 — Adapter Arweave (Turbo)

**Obiettivo:** upload reale su Arweave.

| Commit | Contenuto |
| --- | --- |
| 1 | `adapters/arweave-turbo-storage.ts`: `uploadBlob` / `uploadJson` → `ar://{id}` |
| 2 | Config secrets, tag Andromeda, errori tipizzati (`ArweaveUploadError`) |
| 3 | Fake Turbo client nei test |
| 4 | Script smoke `scripts/arweave-turbo-smoke.ts` |

**DoD:** `PERMANENT_STORAGE_BACKEND=arweave` in locale carica un JSON di prova e lo fetcha via gateway.

---

### PR 3 — ACE + Zod accettano `ar://`

**Obiettivo:** metadata pubblici validi con URI Arweave.

| Commit | Contenuto |
| --- | --- |
| 1 | Schema: `contentUriSchema` = `ar://` \| `ipfs://` (legacy) |
| 2 | Aggiornare `publish-service`, test metadata |
| 3 | Aggiornare `documentation/ace-v1.md`: URI normativi `ar://`; nota legacy IPFS |
| 4 | `toGatewayUrl` / reader / work-metadata-loader risolvono entrambi |

**DoD:** build ACE con `ar://` passa validazione; fixture IPFS legacy ancora ok in read.

---

### PR 4 — Publish path su Arweave

**Obiettivo:** nuovo upload non usa più Pinata.

| Commit | Contenuto |
| --- | --- |
| 1 | `work-upload-mutations` / `publishWorkToIpfs` → `publishWorkToPermanentStorage` |
| 2 | Preview env: backend `arweave` |
| 3 | CSP: gateway Arweave in `connect-src` / `img-src` |
| 4 | Smoke E2E: upload → `registerWork(ar://…)` su Amoy |

**DoD:** Polygonscan mostra `metadataURI` che inizia con `ar://`; gateway restituisce JSON ACE.

---

### PR 5 — Edition metadata + envelope su Arweave

| Commit | Contenuto |
| --- | --- |
| 1 | Edition metadata upload → `ar://` + `setCopyMetadataURI` |
| 2 | Envelope upload → `ar://` |
| 3 | Contratto: `envelopeURIOfToken` / `setCopyEnvelopeURI` + ABI sync + indexer |
| 4 | Client labeling: dopo pin, tx envelope URI; UX “copia completa” solo dopo receipt |
| 5 | Attesa receipt tra tx (già introdotta) invariata |

**DoD:** `tokenURI` e `envelopeURIOfToken` sono `ar://…`; reference read path funziona.

---

### PR 6 — Gateway resolver Arweave + UX read

| Commit | Contenuto |
| --- | --- |
| 1 | `arweave-gateway-resolver.ts` (failover) |
| 2 | Catalogo / reader / avatar usano resolver unificato |
| 3 | Messaggi errore “contenuto non raggiungibile su Arweave” |
| 4 | Test failover |

**DoD:** gateway primario down → secondo gateway recupera lo stesso `ar://`.

---

### PR 7 — Cutover Preview + deprecazione Pinata in write path

| Task | Contenuto |
| --- | --- |
| 1 | Vercel Preview: solo `arweave` per write |
| 2 | Rimuovere default Pinata da factory write |
| 3 | Runbook: credits Turbo, limiti size, retry |
| 4 | Metriche: upload success rate, costo medio |

**DoD:** Pinata down non blocca publish Preview.

---

### PR 8 — Migrazione opere legacy (IPFS → Arweave)

**Obiettivo:** opere già certificate con `ipfs://` possono essere ripubblicate su Arweave.

| Commit | Contenuto |
| --- | --- |
| 1 | Script `migrate-ipfs-to-arweave.ts`: fetch IPFS → upload Arweave → report vecchio/nuovo URI |
| 2 | Policy aggiornamento on-chain: |
|    | — **Work metadata:** solo se esiste funzione/autorizzazione (oggi `metadataURI` work è immutabile nel contratto) → documentare limiti |
|    | — **Copy metadata / envelope:** owner può `setCopyMetadataURI` / `setCopyEnvelopeURI` verso nuovi `ar://` |
| 3 | Se work-level URI è immutabile: opzioni (a) lasciare IPFS legacy in read forever; (b) evoluzione contratto `updateWorkMetadataURI` solo author — **decisione esplicita in PR** |
| 4 | Report orphan (IPFS irrecuperabile) |

**Decisione consigliata per work URI immutabile:**  
introdurre `updateWorkMetadataURI(workId, newURI)` **solo author**, emettendo evento, così il
certificato può essere ripuntato ad Arweave senza re-mint. In alternativa accettare dual-read
IPFS legacy senza migrare il work URI.

**DoD:** almeno un’opera di test ha tutti i blob critici su Arweave e discovery da chain.

---

### PR 9 — Reference reader ACE (Arweave) + cutover Production

| Task | Contenuto |
| --- | --- |
| 1 | CLI/web minimale: RPC + `ar://` + decrypt (nessuna API Andromeda) |
| 2 | Continuity export (indice URI) caricato su Arweave |
| 3 | Production: backend `arweave`; Pinata rimosso dai secret critici |
| 4 | i18n: messaggi storage permanente |
| 5 | (Doc parziale) aggiornare sezioni env già toccate; **passata completa → PR 10** |

**DoD:** app Andromeda offline → reference reader legge una copia Amoy/mainnet di test con soli `ar://`.

---

### PR 10 — Documentazione tecnica del progetto

**Obiettivo:** allineare **tutta** la documentazione pubblica e operativa allo storage Arweave,
così che README, spec ACE, comandi blockchain e template env non parlino più di Pinata/IPFS come
path primario.

| Commit | Contenuto |
| --- | --- |
| 1 | `README.md`: stack, flusso contenuto, “What goes on storage”, env Vercel, roadmap |
| 2 | `documentation/ace-v1.md`: URI `ar://`, layout blob, esempi, discovery envelope on-chain |
| 3 | `documentation/blockchain/commands.md` + `apps/web/.env.example` (+ `.env.*.example` se presenti) |
| 4 | Note di coerenza su piani storici (`web3-layer-architecture.md`, `catalog.md`) — addendum o rewrite sezioni IPFS |
| 5 | Opz. `documentation/ops/arweave-runbook.md` (credits Turbo, gateway, migrate legacy) |

**DoD:** checklist documentazione (sotto) tutta ✓; nessuna istruzione “configura Pinata” come passo obbligatorio per nuovi deploy; `pnpm web:i18n:check-keys` invariato se non si toccano solo stringhe già previste.

---

## Documentazione tecnica da aggiornare

La migrazione **non è completa** finché la documentazione del repo descrive ancora IPFS/Pinata
come storage di produzione. Aggiornamenti **incrementali** nelle PR 3–9 (spec/env dove toccati)
e **passata finale** in PR 10.

### Inventario file

| File | Cosa cambiare |
| --- | --- |
| [`README.md`](../../README.md) | Sostituire “IPFS / Pinata” con **Arweave** nello stack, nel flusso contenuto, nella tabella “What goes on …”, nella checklist env Vercel (`ARWEAVE_*` al posto di `IPFS_*`), nella roadmap (“permanent storage on Arweave”). Mantenere nota breve su **legacy** `ipfs://` in lettura se ancora supportato. |
| [`documentation/ace-v1.md`](../ace-v1.md) | Titolo/intro: pubblicazione su Arweave; diagrammi `ar://`; esempi metadata OpenSea con `ar://`; ciphertext/envelope su Arweave; discovery envelope via `envelopeURIOfToken`; sezione legacy IPFS (opzionale, deprecata). |
| [`documentation/blockchain/commands.md`](../blockchain/commands.md) | Flusso publish → Arweave + `registerWork`; variabili env; comandi smoke Turbo se aggiunti. |
| [`apps/web/.env.example`](../../apps/web/.env.example) | Documentare `PERMANENT_STORAGE_BACKEND`, `ARWEAVE_*`, gateway; marcare `IPFS_*` come legacy/deprecated. |
| [`apps/web/.env.development`](../../apps/web/.env.development) / production comments | Commenti coerenti (no secret). |
| [`documentation/plans/web3-layer-architecture.md`](./web3-layer-architecture.md) | Addendum in cima: “Storage target superseduto da Arweave — vedi `storage-indipendence.md`”; oppure aggiornare sezioni IPFS/Pinata per non contraddire il README. **Non** riscrivere tutto lo storico PR 1–12 se non necessario: preferire banner + link. |
| [`documentation/plans/catalog.md`](./catalog.md) | Sostituire “fetch IPFS” con “fetch metadata ACE via gateway Arweave (o legacy IPFS)” nei vincoli architetturali. |
| Opz. nuovi | `documentation/ops/arweave-runbook.md` — credits, limiti size, rotate key, migrate, verifica `ar://` su gateway |

### Contenuti minimi da far comparire nel README

1. **Stack:** Arweave (Turbo) come storage permanente; URI `ar://`.  
2. **Certificato on-chain:** `metadataURI` / `tokenURI` / envelope URI puntano ad Arweave.  
3. **Env Production/Preview:** tabella variabili Arweave (server-only per auth Turbo).  
4. **Longevità:** lettura possibile con reader ACE + RPC + gateway pubblici, senza app Andromeda.  
5. **Link** a `ace-v1.md` e a questo piano.

### Checklist documentazione (acceptance PR 10)

- [ ] `README.md` non indica Pinata/IPFS come unico storage di produzione.  
- [ ] `ace-v1.md` usa `ar://` negli esempi normativi.  
- [ ] `.env.example` elenca le variabili Arweave e depreca Pinata.  
- [ ] `blockchain/commands.md` descrive publish su Arweave.  
- [ ] Piani `web3-layer-architecture.md` / `catalog.md` non contraddicono il target (banner o patch).  
- [ ] Nessun secret (JWK, credits) committato negli esempi.  

---

## Contratto: cosa cambia e cosa no

| Elemento | Azione |
| --- | --- |
| `registerWork(string metadataURI, …)` | **Invariato** — passare `ar://…` |
| `setCopyMetadataURI` | **Invariato** — `ar://…` |
| `setCopyEnvelopeURI` (nuovo) | **Aggiungere** per discovery envelope |
| `updateWorkMetadataURI` (opz. migrazione) | Solo se si vuole ripuntare opere legacy a livello work |
| Eventi | `CopyEnvelopeUpdated`; opz. `WorkMetadataUpdated` |

Nessun binding hard-coded a Pinata o IPFS nel bytecode.

---

## Sicurezza e costi

| ID | Rischio | Mitigazione |
| --- | --- | --- |
| **A-01** | Chiave Turbo / JWK leak | Solo server env; rotate; no log |
| **A-02** | Costo upload illimitato | Rate limit già su upload; quota per wallet; alert saldo credits |
| **A-03** | Autore non controlla il funding Arweave (v1 platform-paid) | Policy abuse; v2 “bring your own credits” |
| **A-04** | Gateway Arweave singolo SPOF in read | Lista failover `ARWEAVE_GATEWAY_URLS` |
| **A-05** | Confusione `ar://` vs HTTPS | On-chain e ACE usano solo `ar://`; HTTPS solo in resolver |
| **A-06** | `K` su server | Vietato (invariato ACE) |

---

## Testabilità

- Adapter Turbo: client fake (id deterministici).  
- Schema ACE: fixture `ar://` + legacy `ipfs://`.  
- Publish / edition / envelope: fake storage in-memory che restituisce `ar://test-…`.  
- Reference reader: fake RPC + fake gateway.  
- Coverage ≥ 80% su `lib/ipfs/**` rinominato / `lib/storage/**` e servizi toccati.

---

## Criteri di accettazione globali

1. Nuovo publish: tutti i blob critici su Arweave; on-chain URI `ar://`.  
2. Pinata spento → publish **funziona** (post-cutover).  
3. `tokenURI` + `envelopeURIOfToken` bastano a un reader terzo con gateway pubblico.  
4. Catalogo/reader risolvono `ar://` con failover.  
5. ACE v1 (aggiornata) documenta `ar://` come normativo.  
6. Piano di migrazione legacy eseguito o esplicitamente limitato (work URI immutabile).  
7. Nessun secret Arweave nel repo.  
8. **Documentazione tecnica** (README, ACE, commands, `.env.example`, piani correlati) allineata ad Arweave — checklist PR 10 verde.

---

## Fuori scope

- Self-hosted Kubo / multi-pin IPFS (superseded).  
- Escrow di `K` server-side.  
- Filecoin come primario (Arweave è la scelta).  
- Cambiare cipher ACE.  
- Pagamento upload diretto dall’autore (v2).  
- Riscrivere per intero la cronologia dei commit in `web3-layer-architecture.md` (basta addendum + sezioni contraddittorie).

---

## Ordine di esecuzione

```
PR1 astrazione → PR2 Turbo adapter → PR3 ACE ar:// (+ patch ace-v1.md)
  → PR4 publish → PR5 edition+envelope on-chain
  → PR6 gateway resolver → PR7 Preview cutover
  → PR8 legacy migrate → PR9 Production + reference reader
  → PR10 documentazione tecnica (README, env, commands, piani)
```

Doc **incrementale** consentita nelle PR in cui si tocca il comportamento (spec/env);
PR 10 è il gate di completezza documentale.

---

## Riferimenti codice e documentazione

| Area | Path |
| --- | --- |
| Port Pinata odierna | `apps/web/src/lib/ipfs/ports/ipfs-storage-port.ts` |
| Adapter Pinata | `apps/web/src/lib/ipfs/adapters/pinata-ipfs-storage.ts` |
| Factory | `apps/web/src/lib/works/ipfs-server.ts` |
| ACE schema | `apps/web/src/lib/ipfs/metadata-schema.ts` |
| Publish | `apps/web/src/lib/works/publish-service.ts` |
| Edition / envelope | `edition-metadata-service.ts`, `token-envelope-service.ts` |
| Contratto | `packages/contracts/contracts/AndromedaWorks.sol` |
| README | `README.md` |
| Spec ACE | `documentation/ace-v1.md` |
| Comandi chain | `documentation/blockchain/commands.md` |
| Env template | `apps/web/.env.example` |
| Architettura Web3 (storico) | `documentation/plans/web3-layer-architecture.md` |
| Piano catalogo | `documentation/plans/catalog.md` |
| Turbo | [@ardrive/turbo-sdk](https://docs.ar.io/sdks/turbo-sdk/) |
| NFT su Arweave | [Storing NFTs on ar.io](https://docs.ar.io/build/guides/storing-nfts/) |
