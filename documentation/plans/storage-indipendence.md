# Piano: indipendenza dello storage IPFS e longevità delle opere

Implementazione incrementale di uno **storage IPFS first-party** e di un modello di
**accessibilità durable** per Andromeda, in modo che:

1. l’accesso alle opere **non dipenda** da un unico provider SaaS (oggi Pinata);
2. se un lettore **compra una copia certificata on-chain**, l’opera resti **sua** e resti
   **leggibile** anche se Andromeda (app, API, Mongo, Kubo operativo) chiude, tramite
   qualsiasi reader ACE-compatible e gateway IPFS generici.

Ogni commit corrisponde a un’unità di lavoro reviewabile; i commit sono raggruppati in
**PR** sequenziali.

Riferimenti: [web3-layer-architecture.md](./web3-layer-architecture.md) (sezione IPFS / ACE),
[ace-v1.md](../ace-v1.md), [catalog.md](./catalog.md), [README](../../README.md).

---

## Principio di prodotto (vincolante)

> **Copia on-chain = proprietà + accessibilità indipendente dalla piattaforma.**
>
> Chi possiede il token ERC-721 di una copia deve poter recuperare e leggere l’opera
> **senza** account Andromeda, **senza** API Andromeda, **senza** Mongo Andromeda e
> **senza** dipendere da un singolo servizio terzi (Pinata, un solo gateway, un solo
> operatore).

| Affermazione | Implicazione tecnica |
| --- | --- |
| L’opera è **sua** | Ownership e trasferibilità restano sul contratto (`ownerOf`, transfer ERC-721) |
| Sempre **accessibile** | Tutti i blob necessari (metadata, ciphertext, envelope) restano raggiungibili via CID |
| Indipendente dalla **piattaforma** | Discovery e decifratura possibili solo con: chain RPC + IPFS + wallet + specifica ACE |
| Indipendente dai **servizi terzi** | Nessun singolo SaaS/pinner/gateway è SPOF; almeno una replica durable non-Andromeda |

**Limite onesto (fisica di IPFS):** se *nessun* nodo al mondo conserva i byte di un CID, il
contenuto è perso. Il piano non inventa immortalità cosmica; rende **probabile e
operativamente verificabile** che i byte restino in almeno **due** pinset indipendenti e
che un reader terzo sappia **dove** trovarli **senza** l’indexer Andromeda.

---

## Obiettivo di prodotto (due orizzonti)

### Orizzonte A — Indipendenza operativa (Pinata / SaaS)

Mentre Andromeda è attiva, pin e read non dipendono da Pinata.

| Capacità | Comportamento target |
| --- | --- |
| **Pin (write)** | Blob su **nodo Kubo Andromeda** (primario). Pinata opzionale / secondario. |
| **Read (gateway)** | Lista di gateway con failover; primario = gateway Andromeda. |
| **Verifica** | Health-check post-pin via gateway primario. |
| **Migrazione** | Re-pin opere legacy Pinata → Kubo. |

### Orizzonte B — Longevità / exit (Andromeda chiude)

Se Andromeda cessa attività, il possessore del token deve ancora poter leggere.

| Capacità | Comportamento target |
| --- | --- |
| **Discovery envelope** | CID envelope **on-chain** (o in metadata tokenURI immutabilmente aggiornato e leggibile da chain), non solo in Mongo |
| **Persistenza multi-pin** | Ogni blob critico pinnato su **≥ 2** backend indipendenti (Kubo Andromeda + durable esterno) |
| **Continuity package** | Export pubblico periodico (CID map) pinnato su IPFS; runbook di handoff |
| **Reader di riferimento** | Tool open-source ACE (CLI o web statico) che legge solo da chain + IPFS |
| **Archive escape hatch** | Mirror byte keyed by CID esportabile / affidabile a terzi in caso di exit |

**Non obiettivo:** salvare `K` sul server; cambiare il cipher ACE; garantire lettura se i byte
sono spariti da ogni pinset e dall’archive; CDN globale oltre ai gateway documentati.

---

## Problema attuale (due SPOF)

### SPOF 1 — Pinata (operativo)

```
UI / API  →  IpfsStoragePort  →  [solo Pinata]  →  rete IPFS
                                   ↑
                          gateway default = gateway.pinata.cloud
```

| Gap | Impatto se Pinata chiude |
| --- | --- |
| Un solo adapter di pin | Nuovi upload / envelope impossibili |
| Gateway default Pinata | Catalogo e reader degradati / rotti |
| Nessun multi-pin | CID solo sui nodi Pinata → spariscono |
| Nessuna verifica post-pin | Pin “ok” senza prova di reachability |

### SPOF 2 — Piattaforma Andromeda (longevità)

Anche con Kubo proprio, se Andromeda spegne app + Kubo + Mongo:

| Gap | Impatto se Andromeda chiude |
| --- | --- |
| `envelopeCid` solo in Mongo | Reader terzo non sa quale CID scaricare per la copia |
| Pinset solo Kubo Andromeda | Blob spariscono dalla rete se il volume non è handoff-ato |
| Nessun export continuity | Nessuna mappa pubblica work/token → CID |
| Nessun reader di riferimento fuori dall’app | ACE esiste sulla carta ma non c’è un client minimale collaudato |
| Avatar / path hardcodati | Fragilità UX, non bloccante per ACE |

**Vincolo già rispettato (seam):** il dominio parla a `IpfsStoragePort`. Va esteso con
discovery on-chain e pin durable multipli.

---

## Scenario: Andromeda chiude (acceptance story)

**Given** un lettore possiede `tokenId` sul contratto `AndromedaWorks`  
**And** i blob (metadata, ciphertext, envelope) sono ancora in almeno un pinset pubblico o
nell’archive continuity  
**When** Andromeda.app, le API, Mongo e il Kubo Andromeda sono offline  
**Then** il lettore può:

1. Leggere `tokenURI(tokenId)` e/o `works[workId].metadataURI` da un RPC Polygon qualsiasi.
2. Scaricare il JSON ACE da un gateway IPFS pubblico (`ipfs.io`, `dweb.link`, …).
3. Risolvere `ace.encrypted_content` e l’**envelope CID on-chain** (vedi decisione sotto).
4. Firmare `Andromeda reader key v1` con il wallet proprietario.
5. Decifrare e leggere l’opera con un **reader ACE di terze parti** (incluso il reference client
   del repo).

**Fallisce** solo se i byte del CID non esistono più in alcun pinset/archive — caso che il
piano rende esplicito e mitigato (multi-pin + archive + handoff), non nascosto.

---

## Stato attuale vs target

| Aspetto | Oggi | Target Orizzonte A | Target Orizzonte B (exit) |
| --- | --- | --- | --- |
| Pin provider | Solo Pinata | Kubo primario ± Pinata | Kubo + **≥1 durable esterno** obbligatorio per blob critici |
| Gateway | Default Pinata | Failover list | Qualsiasi gateway; content-addressed |
| Envelope discovery | Mongo `tokens.envelopeCid` | Invariato in app | **On-chain** (campo o metadata) |
| Continuity map | Assente | `ipfs_pins` interno | Export pubblico pinnato su IPFS |
| Reader senza app | Solo specifica ACE | — | CLI/web reference open-source |
| Opere legacy | Solo Pinata | Re-pin Kubo | Re-pin multiplo + backfill envelope on-chain |

---

## Decisioni di prodotto (vincolanti)

| Decisione | Scelta | Motivazione |
| --- | --- | --- |
| **Principio** | Copia acquistata → accessibile senza piattaforma | Core value Web3 / ACE |
| **Fonte operativa storage** | Kubo Andromeda (primario write path) | Controllo pinset mentre la piattaforma è viva |
| **Pinata** | Opzionale dopo cutover A | Non SPOF |
| **Durable secondario** | **Obbligatorio** per blob critici (ciphertext, metadata, envelope; cover best-effort) | Sopravvivenza se Kubo Andromeda muore |
| **Durable provider v1** | Un pinner/Filecoin-compatible **distinto** da Pinata-as-primary (es. Storacha/web3.storage, Filebase, o secondo Kubo di un ente terzo) | Indipendenza organizzativa |
| **Discovery envelope** | **On-chain** — nuova API contratto `setCopyEnvelopeURI` + `envelopeURIOfToken` + evento `CopyEnvelopeUpdated` (preferita); alternativa: aggiornare token metadata ACE con campo `ace.envelope` via `setCopyMetadataURI` | Reader terzo senza Mongo |
| **ACE crypto** | Invariata (`K` mai server-side) | Sicurezza paywall tecnico |
| **Mongo** | Proiezione UX, mai fonte di verità per discovery | Exit-safe |
| **Garanzia “sempre accessibile”** | Byte in ≥2 pinset indipendenti **e** discovery da chain **e** reader ACE open | Definizione operativa del principio |
| **Handoff exit** | Runbook + export continuity + trasferimento volume/archive a custode (fondazione / multisig / open dump) | Andromeda chiude ≠ opere muoiono |
| **Cutover** | Prima Orizzonte A (Preview→Prod), poi Orizzonte B (envelope on-chain + durable + reference reader) | Evita big-bang |

### Decisione envelope on-chain (dettaglio)

**Scelta preferita — estensione contratto:**

```solidity
mapping(uint256 => string) public envelopeURIOfToken; // ipfs://…

function setCopyEnvelopeURI(uint256 tokenId, string calldata envelopeURI) external;
// only token owner (o autore in finestra post-mint — da precisare in PR contratto)
event CopyEnvelopeUpdated(uint256 indexed tokenId, string envelopeURI);
```

- Indexer proietta in Mongo come oggi, ma Mongo è cache.
- ACE v1: aggiornare §5 — discovery normativa = `envelopeURIOfToken(tokenId)` (o equivalente).
- Flusso mint: dopo pin envelope → tx `setCopyEnvelopeURI` (come già si fa per `setCopyMetadataURI`).

**Alternativa senza nuovo storage slot:** includere `ace.envelope: "ipfs://…"` nel JSON di
`tokenURI` e richiamare `setCopyMetadataURI` dopo il pin. Meno elegante (metadata muta due
volte) ma evita upgrade di mapping; comunque exit-safe se `tokenURI` è leggibile on-chain.

---

## Architettura target

### Orizzonte A — write/read operativi

```
                    ┌─────────────────────────────────────────┐
  API / services    │           IpfsStoragePort               │
                    │  pinBlob · pinJson · toGatewayUrl       │
                    │  (+ fetchBytes · pinCid)                │
                    └─────────────────┬───────────────────────┘
                                      │
                    ┌─────────────────▼───────────────────────┐
                    │     createIpfsStorageFromEnv()          │
                    │  backend=kubo | pinata | composite      │
                    └─────┬─────────────────────┬─────────────┘
                          │                     │
              ┌───────────▼──────────┐   ┌──────▼──────────────┐
              │  KuboIpfsStorage     │   │ Pinata (opz.)       │
              └───────────┬──────────┘   └─────────────────────┘
                          │
              ┌───────────▼──────────┐     ┌──────────────────┐
              │  Nodo Kubo Andromeda │────▶│ Object archive   │
              └───────────┬──────────┘     └──────────────────┘
                          │
              ┌───────────▼──────────────────────────────────┐
              │  GatewayResolver (failover)                  │
              └──────────────────────────────────────────────┘
```

### Orizzonte B — longevità / exit

```
  registerWork / setCopyMetadataURI / setCopyEnvelopeURI
              │
              ▼
     ┌──────────────── on-chain ────────────────┐
     │ metadataURI · tokenURI · envelopeURI     │  ← discovery senza Andromeda
     └──────────────────┬───────────────────────┘
                        │ ipfs:// CID
                        ▼
     ┌────────────── IPFS multi-pin ────────────┐
     │ 1. Kubo Andromeda                        │
     │ 2. Durable esterno (Filecoin/pinner #2)  │  ← sopravvive a exit ops
     │ 3. (opz.) archive S3 esportabile         │
     └──────────────────┬───────────────────────┘
                        │
                        ▼
     ┌────────── qualsiasi gateway pubblico ────┐
     │ ipfs.io / dweb.link / gateway terzi      │
     └──────────────────┬───────────────────────┘
                        │
                        ▼
     ┌────────── ACE reference reader ──────────┐
     │ chain RPC + wallet sign + decrypt locale │  ← nessuna API Andromeda
     └──────────────────────────────────────────┘
```

### Layering (Clean Architecture)

```
UI / API → Zod + auth → publish / envelope / edition services
                              ↓
                     IpfsStoragePort + chain envelope URI writer
                              ↓
         adapters: kubo | durable | pinata | composite | in-memory
```

- **Dominio:** nessuna URL vendor; regola “blob critici → pin su N backend”.
- **Contratto:** discovery envelope normativa.
- **Delivery:** app Andromeda è *un* reader; non l’unico.

### Estensione della port

```ts
export type IpfsStoragePort = {
  pinBlob(data: Uint8Array, options?: PinOptions): Promise<PinResult>;
  pinJson(data: unknown, options?: PinOptions): Promise<PinResult>;
  toGatewayUrl(cid: Cid | IpfsUri): string;
  fetchBytes?(cid: Cid | IpfsUri): Promise<Uint8Array>;
  pinCid?(cid: Cid, options?: PinOptions): Promise<void>;
};
```

Il composite in Orizzonte B richiede successo su **primario + durable** per
`kind ∈ {content, metadata, envelope}` (cover può restare best-effort).

---

## Infrastruttura Kubo (operativa)

### Deploy consigliato (v1)

| Componente | Scelta v1 | Note |
| --- | --- | --- |
| Nodo | Kubo in Docker su VPS/VM dedicata | Volume persistente; incluso nel handoff exit |
| API | `IPFS_KUBO_API_URL` | Mai pubblica senza auth |
| Gateway | `https://ipfs.<dominio>/ipfs` | Rate limit; non unica via di lettura |
| Monitoring | Disk, pin count, gateway 5xx | Alert |

### Variabili d’ambiente

| Variabile | Scope | Ruolo |
| --- | --- | --- |
| `IPFS_STORAGE_BACKEND` | server | `kubo` \| `pinata` \| `composite` |
| `IPFS_KUBO_API_URL` / `IPFS_KUBO_API_TOKEN` | server | Kubo |
| `IPFS_GATEWAY_URLS` | server (+ public) | Failover read |
| `NEXT_PUBLIC_IPFS_GATEWAY_BASE_URL` | public | Preferito browser |
| `IPFS_PINNING_API_KEY` | server | Solo se Pinata abilitata |
| `IPFS_SECONDARY_PIN_ENABLED` | server | Replica Pinata (Orizzonte A) |
| `IPFS_DURABLE_PIN_ENABLED` | server | Replica durable obbligatoria (Orizzonte B) |
| `IPFS_DURABLE_*` | server | Credenziali pinner/Filecoin #2 |
| `IPFS_VERIFY_AFTER_PIN` | server | Default `true` in production |
| `IPFS_BLOB_ARCHIVE_ENABLED` / `IPFS_BLOB_ARCHIVE_*` | server | Mirror byte |
| `IPFS_CRITICAL_PIN_MIN_BACKENDS` | server | Default `2` post-Orizzonte B |

Deprecare default hard-coded `gateway.pinata.cloud` dopo cutover A.

---

## Flussi applicativi

1. **Publish** — pin cover / ciphertext / metadata → verify → (B) durable pin critici.
2. **Edition metadata** — pin JSON copia → `setCopyMetadataURI`.
3. **Envelope** — pin blob → Mongo `envelopeCid` → **(B) `setCopyEnvelopeURI` on-chain**.
4. **Read (app)** — gateway resolver; discovery envelope da Mongo *o* chain.
5. **Read (exit)** — solo chain + IPFS + reference reader.

**Criterio “copia completa” (post-B):** mint/envelope UX non è “success” finché
`envelopeURIOfToken(tokenId)` è valorizzato on-chain e i CID critici risultano verified su
≥ `IPFS_CRITICAL_PIN_MIN_BACKENDS` backend.

---

## Modello dati

### Collection `ipfs_pins`

```ts
export type IpfsPinRecord = {
  cid: string;
  kind: "cover" | "content" | "metadata" | "token-metadata" | "envelope" | "other";
  workId: string | null;
  tokenId: string | null;
  backends: Array<"kubo" | "pinata" | "durable" | "archive">;
  verifiedAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
};
```

### Continuity package (export pubblico)

JSON (o CAR) pubblicato periodicamente e pinnato:

```ts
export type ContinuityPackage = {
  version: 1;
  chainId: number;
  contractAddress: `0x${string}`;
  exportedAt: string; // ISO
  works: Array<{
    workId: string;
    metadataURI: string;
    contentCid: string;
    coverCid?: string;
  }>;
  tokens: Array<{
    tokenId: string;
    workId: string;
    metadataURI: string | null;
    envelopeURI: string; // on-chain source of truth
  }>;
};
```

Il CID del package stesso va documentato (README / site / ENS / repo release) così un terzo
può bootstrappare l’indice senza Mongo.

### Campi esistenti

| Campo | Azione |
| --- | --- |
| `works.encryptedContentCid` | Popolare all’upload / indexer |
| `tokens.envelopeCid` | Resta cache; allineato a on-chain dopo B |
| `work_uploads.*Cid` | Input backfill |

---

## Piano PR (sequenziale)

### Fase A — Indipendenza da Pinata

#### PR 1 — Config e factory multi-backend

Pinata resta default finché Kubo non è attivo.

| Commit | Contenuto |
| --- | --- |
| 1 | Config generica (`IpfsStorageEnvConfig`) |
| 2 | `createIpfsStorageFromEnv()` + `IPFS_STORAGE_BACKEND` |
| 3 | Doc env + blockchain commands |
| 4 | Test factory |

**DoD:** nessun cambio comportamentale prod; coverage ≥ 80% nuovi moduli.

---

#### PR 2 — Adapter Kubo

| Commit | Contenuto |
| --- | --- |
| 1 | `kubo-ipfs-storage.ts` (`add` + `pin/add`) |
| 2 | Auth, timeout, logging `ipfs.kubo` |
| 3 | Test con HTTP fake |
| 4 | Smoke script opzionale |

**DoD:** `backend=kubo` locale con Docker; CI senza daemon.

---

#### PR 3 — Gateway resolver con failover

| Commit | Contenuto |
| --- | --- |
| 1 | `gateway-resolver.ts` |
| 2 | Integrare metadata loader + reader |
| 3 | `avatar-src.ts` senza hardcode |
| 4 | Env `IPFS_GATEWAY_URLS` + test |

**DoD:** failover funziona con primario down.

---

#### PR 4 — Verify-after-pin + composite (Pinata secondario)

| Commit | Contenuto |
| --- | --- |
| 1 | `verifyCidReachable` |
| 2 | `CompositeIpfsStorage` (primario obbligatorio) |
| 3 | `pinCid` |
| 4 | Flag verify / secondary |

**DoD:** Pinata down non blocca publish su `kubo`/`composite`.

---

#### PR 5 — Deploy Kubo + cutover Preview

| Task | Contenuto |
| --- | --- |
| Ops | Compose + volume + reverse proxy |
| 1 | Secrets Preview |
| 2 | Smoke E2E publish → read |
| 3 | Runbook ops (disk, re-pin, token) |

**DoD:** Preview non usa Pinata come primario.

---

#### PR 6 — Backfill re-pin legacy → Kubo

| Commit | Contenuto |
| --- | --- |
| 1 | Script `re-pin-from-mongo.ts` |
| 2 | Report verified / orphan |
| 3 | Collection `ipfs_pins` |
| 4 | Popolare `encryptedContentCid` |

**DoD:** report orphan; CID verified su Kubo Preview.

---

#### PR 7 — Archivio object-store

| Commit | Contenuto |
| --- | --- |
| 1 | `BlobArchivePort` + adapter S3/R2 |
| 2 | `put` post-pin |
| 3 | Job restore archive → Kubo |
| 4 | Retention / encryption |

**DoD:** wipe volume Kubo → restore da archive → stessi CID.

---

#### PR 8 — Cutover Production (Orizzonte A completo)

| Task | Contenuto |
| --- | --- |
| 1 | Env Production Kubo/composite |
| 2 | Backfill production |
| 3 | Rimuovere default gateway Pinata |
| 4 | Doc README / commands |

**DoD:** Pinata down non impedisce publish/read operativi.

---

### Fase B — Longevità / Andromeda chiude

#### PR 9 — Envelope URI on-chain

**Obiettivo:** discovery senza Mongo / senza app.

| Commit | Contenuto |
| --- | --- |
| 1 | `AndromedaWorks`: `envelopeURIOfToken`, `setCopyEnvelopeURI`, evento; test Hardhat |
| 2 | Sync ABI; indexer `CopyEnvelopeUpdated` → Mongo |
| 3 | Client mint/envelope: dopo pin → tx on-chain; UX “copia pronta” solo dopo receipt |
| 4 | Aggiornare `ace-v1.md` §5: discovery normativa on-chain |
| 5 | Backfill: per token con `envelopeCid` Mongo, submit `setCopyEnvelopeURI` (owner/signer policy) |

**DoD:** spegnendo Mongo, un client che legge solo RPC + contratto ottiene `ipfs://` envelope.

**Sicurezza:** solo owner del token (o regola esplicita documentata) può settare/aggiornare;
validare prefisso `ipfs://`; idempotenza se già uguale.

---

#### PR 10 — Durable multi-pin obbligatorio (blob critici)

**Obiettivo:** ≥2 pinset indipendenti per content / metadata / envelope.

| Commit | Contenuto |
| --- | --- |
| 1 | Adapter `DurableIpfsStorage` (provider #2) |
| 2 | Composite: `IPFS_CRITICAL_PIN_MIN_BACKENDS=2` per kind critici |
| 3 | Fail publish/envelope se durable fallisce (non best-effort silenzioso) |
| 4 | Metriche: pin dual-success rate; alert |

**DoD:** Kubo Andromeda spento in test → CID ancora fetchabile via gateway pubblico dal pinset #2.

---

#### PR 11 — Continuity package + exit runbook

**Obiettivo:** handoff e bootstrap terzi.

| Commit | Contenuto |
| --- | --- |
| 1 | Script `export-continuity-package.ts` (da chain preferibilmente; Mongo fallback) |
| 2 | Pin del package su Kubo + durable; pubblicare CID in release notes / docs |
| 3 | Job schedulato (cron) export periodico |
| 4 | `documentation/ops/exit-handoff.md`: spegnimento app, trasferimento volume/archive, DNS gateway, comunicazione possessori token |

**DoD:** da solo continuity CID + RPC + reference reader si elenca almeno un’opera e se ne verifica la reachability.

---

#### PR 12 — ACE reference reader (open-source)

**Obiettivo:** dimostrare lettura senza piattaforma Andromeda.

| Commit | Contenuto |
| --- | --- |
| 1 | Package o app minimale (`packages/ace-reader` o `apps/ace-reader`): input `chainId`, contract, `tokenId`, RPC, gateway |
| 2 | Flusso: `ownerOf` check → `tokenURI` / work metadata → `envelopeURIOfToken` → fetch → sign → decrypt |
| 3 | README “Read without Andromeda”; link da `ace-v1.md` |
| 4 | Test integrazione con fake chain + in-memory IPFS |

**DoD:** checklist manuale Preview: app Andromeda offline (hosts file / env) → reference reader legge una copia reale Amoy.

---

#### PR 13 — Cutover longevità in Production

| Task | Contenuto |
| --- | --- |
| 1 | Deploy contratto aggiornato (Amoy già in 9; mainnet quando pronto) |
| 2 | Durable pin obbligatorio in Production |
| 3 | Backfill envelope on-chain + dual-pin legacy |
| 4 | Continuity package pubblico; reference reader taggato |
| 5 | UX copy: “La tua copia resta leggibile anche senza Andromeda” (i18n) |

**DoD:** criteri di accettazione Orizzonte B verdi in Production (testnet proof + mainnet policy).

---

## Sicurezza

| ID | Rischio | Mitigazione |
| --- | --- | --- |
| **I-01** | API Kubo pubblica | Rete privata + token |
| **I-02** | Gateway aperto / DoS | Rate limit, WAF |
| **I-03** | Secret in log | No Authorization nei log |
| **I-04** | Disco pieno | Rate limit upload, alert |
| **I-05** | Archive bucket leak | Privato; encryption at rest; handoff controllato |
| **I-06** | Overclaim “forever” | Copy onesta: multi-pin + on-chain discovery + reader open; non magia |
| **I-07** | `setCopyEnvelopeURI` malevolo | Solo owner; URI `ipfs://`; event audit |
| **I-08** | Durable provider diventa nuovo SPOF | Min 2 backend; provider #2 ≠ Pinata-as-only; review periodica |
| **I-09** | Continuity package PII | Solo URI/CID pubblici; no chiavi, no plaintext |

Auth mutazioni app: invariata (firma wallet + Zod).

---

## Testabilità e coverage

- Unit: gateway-resolver, factory, composite (min backends), envelope URI builders — fake.
- Contratto: test Hardhat per `setCopyEnvelopeURI` / auth / eventi.
- Reference reader: fake RPC + in-memory IPFS.
- Chaos Preview: “Mongo down”, “Kubo down”, “app down” — checklist documentata.
- Coverage ≥ 80% su `lib/ipfs/**` e moduli longevità toccati.

---

## Criteri di accettazione globali

### Orizzonte A

1. Pinata spento → publish completa su Kubo + verify.
2. Gateway Pinata spento → read via failover.
3. CID pinned sopravvive al restart del processo app (volume Kubo).
4. Restore da archive collaudato in Preview.
5. Report backfill orphan/verified.

### Orizzonte B (principio di proprietà)

6. **Mongo spento** → `envelopeURIOfToken` + `tokenURI` bastano a risolvere i CID.
7. **App Andromeda spento** → reference reader legge una copia di proprietà del wallet.
8. **Kubo Andromeda spento** → CID critici ancora fetchabili dal durable #2 (o gateway che lo raggiunge).
9. Continuity package pinnato e documentato; re-import dry-run ok.
10. Exit runbook revisionato; nessun secret nel package pubblico.
11. Opere post-cutover B: UX non marca “success” senza envelope on-chain + dual-pin verified.

---

## Fuori scope (espliciti)

- Escrow di `K` sul server o recovery key custodial Andromeda.
- Immortalità se ogni pinset e l’archive sono distrutti senza handoff.
- Marketplace / OpenSea come reader ufficiale.
- Multi-region Kubo cluster (ops v2).
- Cambiare il messaggio di firma ACE o il cipher senza major version ACE.

---

## Ordine di esecuzione consigliato

```
Fase A (Pinata → Kubo):
  PR1 → PR2 → PR3 → PR4 → PR5 → PR6 → PR7 → PR8

Fase B (exit / longevità):
  PR9 (envelope on-chain) → PR10 (durable dual-pin)
      → PR11 (continuity + runbook) → PR12 (reference reader)
      → PR13 (production longevità)
```

Dipendenze: Fase B può iniziare in parallelo su contratto (PR 9) dopo PR 4; dual-pin (PR 10)
richiede factory composite (PR 4); reference reader (PR 12) richiede PR 9; PR 13 richiede 9–12.

---

## Riferimenti codice esistenti

| Area | Path |
| --- | --- |
| Port | `apps/web/src/lib/ipfs/ports/ipfs-storage-port.ts` |
| Adapter Pinata | `apps/web/src/lib/ipfs/adapters/pinata-ipfs-storage.ts` |
| Config / default gateway | `apps/web/src/lib/ipfs/ipfs-config.ts` |
| Factory | `apps/web/src/lib/works/ipfs-server.ts` |
| Publish pins | `apps/web/src/lib/works/publish-service.ts` |
| Edition pins | `apps/web/src/lib/works/edition-metadata-service.ts` |
| Envelope pins | `apps/web/src/lib/works/token-envelope-service.ts` |
| Contratto | `packages/contracts/contracts/AndromedaWorks.sol` |
| Spec ACE | `documentation/ace-v1.md` |
| Reader app | `apps/web/src/lib/works/reader-client.ts` |
