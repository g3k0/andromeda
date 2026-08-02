# Piano: pagina catalogo opere

> **Addendum (storage):** i metadata ACE vivono su storage permanente **Arweave**
> (`ar://`); eventuali URI `ipfs://` sono legacy in dual-read. Dove questo piano
> dice ancora “fetch IPFS”, intende “fetch metadata ACE via gateway Arweave
> (o gateway IPFS legacy)”. Target storage: [`storage-indipendence.md`](./storage-indipendence.md).

Implementazione incrementale della **pagina catalogo** in `apps/web`: consultazione pubblica
delle opere registrate on-chain e indicizzate in MongoDB, con **ricerca testuale**, **filtri**
e **paginazione**. Ogni commit corrisponde a un’unità di lavoro reviewabile; i commit sono
raggruppati in **PR** sequenziali.

Riferimenti: [web3-layer-architecture.md](./web3-layer-architecture.md) (PR 8–9: indexer e catalogo
MVP), [db-integration.md](./db-integration.md), [i18n.md](./i18n.md), [README](../../README.md).

---

## Obiettivo di prodotto

La pagina catalogo (`/works`, etichetta nav **Catalog**) è **pubblica** e accessibile a tutti i
ruoli (`reader`, `author`, `admin`) con o senza wallet connesso.

| Elemento UI | Comportamento |
| --- | --- |
| **Barra di ricerca** | In alto; ricerca per titolo (e, opzionalmente, nome autore denormalizzato). Debounce lato client; stato riflesso in URL (`?q=`). |
| **Area filtri (sinistra)** | Sidebar collassabile su mobile. Filtri: autore, lingua, disponibilità copie, tipo edizione, serie. |
| **Lista opere** | Griglia di card (riuso `WorkSummaryCard` / `WorkView`) con titolo, cover, autore, disponibilità. |
| **Paginazione** | **20 opere per pagina** (default); dimensione configurabile via env. Navigazione pagine + indicatore “X–Y di Z”. |

**Non obiettivo v1:** full-text search su testo dell’opera (contenuto cifrato su Arweave /
legacy IPFS); filtri su prezzo numerico avanzato; raccomandazioni; wishlist.

---

## Stato attuale vs target

| Aspetto | Oggi (`/works`) | Target |
| --- | --- | --- |
| Route | `/[locale]/works` | Invariata (nav `nav.catalog` → `/works`) |
| Accesso | Pubblico (`pages:read`) | Invariato |
| Dati | `listWorks()` → tutte le opere attive | Query paginata con filtri |
| Metadata | Fetch metadata ACE via gateway Arweave (o legacy IPFS) **per ogni opera** in SSR (`work-metadata-loader.ts`) | Campi ricercabili **denormalizzati** su Mongo; gateway solo per cover se assente in projection |
| API | `GET /api/works` → array completo | `GET /api/works?q=&author=&language=&…&page=&pageSize=` → `{ works, pagination }` |
| UI | `WorksCatalog` statico, nessun filtro | Layout search + sidebar filtri + paginazione |
| i18n | `catalog.*` base (titolo, empty, card) | + search, filtri, paginazione, errori |
| Test | `catalog-service.test.ts`, `WorksCatalog.test.tsx` | Coverage ≥ **80%** su moduli toccati |

### Vincolo architetturale (metadata ACE / storage permanente)

Titolo, lingua e impronta edizione vivono nel **metadata ACE su Arweave** (`ar://`;
legacy `ipfs://` ancora possibile), non solo nel documento `works`. Per filtri e ricerca
scalabili senza N fetch gateway:

1. **Denormalizzare** al momento dell’upsert indexer (o al completamento publish) i campi
   necessari sul documento Mongo `works`.
2. Trattare Mongo come **proiezione di consultazione**; la fonte di verità resta chain +
   storage permanente (Arweave, o IPFS legacy in dual-read).

---

## Decisioni di prodotto (vincolanti)

| Decisione | Scelta | Motivazione |
| --- | --- | --- |
| Paginazione default | 20 | Specifica utente |
| Page size configurabile | `CATALOG_PAGE_SIZE` (server) + validazione max | Evita abuse (`pageSize=100000`) |
| Ordinamento default | `createdAt` desc (più recenti prima) | UX catalogo tipica; oggi è `asc` — **breaking UX intenzionale** |
| Ricerca | Titolo + nome autore (denormalizzato) | Campi indicizzabili; no scan gateway per query |
| Filtro autore | Indirizzo wallet normalizzato **o** select da autori con opere | Autocomplete v2; v1: input address + validazione Zod |
| Lingua | Codice ISO da `work_imprint.language` | Già in schema ACE |
| Disponibilità | `openEdition` / `soldOut` / `hasCopiesLeft` | Derivato da `maxCopies`, `minted` (logica esistente in `public-dto.ts`) |
| Auth API catalogo | Nessuna firma wallet | Pagina pubblica; rate limit only |
| Rendering | Server Component pagina + **client island** per interattività filtri | URL con `searchParams` per link condivisibili e SEO |

---

## Layout UI

```
┌─────────────────────────────────────────────────────────────┐
│  [ 🔍 Cerca per titolo o autore…                    ] [Cerca]│
├──────────────┬──────────────────────────────────────────────┤
│  Filtri      │  Griglia opere (4 col desktop, 1 mobile)     │
│              │  ┌────┐ ┌────┐ ┌────┐ ┌────┐                  │
│  Autore      │  │card│ │card│ │card│ │card│                  │
│  Lingua      │  └────┘ └────┘ └────┘ └────┘                  │
│  Disponib.   │  …                                             │
│  Edizione    │  ┌────┐ ┌────┐ …                               │
│  Serie       │  └────┘ └────┘                                  │
│  [Reset]     │  « Prev   Pagina 2 di 5   Next »                │
└──────────────┴──────────────────────────────────────────────┘
```

**Componenti previsti** (sotto `apps/web/src/components/works/`):

| Componente | Responsabilità |
| --- | --- |
| `CatalogPageClient.tsx` | Orchestrazione filtri, fetch API, sync URL |
| `CatalogSearchBar.tsx` | Input ricerca + debounce |
| `CatalogFiltersPanel.tsx` | Sidebar filtri + reset |
| `CatalogPagination.tsx` | Controlli pagina + summary |
| `WorksCatalog.tsx` | Griglia + empty / no-results (esteso) |
| `WorkSummaryCard.tsx` | Invariato o adattamenti minimi |

Logica pura (testabile senza React): `lib/works/catalog-query.ts`, `lib/works/catalog-url-state.ts`.

---

## Modello dati — estensione collection `works`

### Nuovi campi (denormalizzati)

```ts
/** Campi di consultazione catalogo — non sostituiscono metadataURI on-chain. */
export type WorkCatalogProjection = {
  title: string;                    // metadata.name
  language: string | null;          // ace.work_imprint.language
  editionKind: "first" | "reprint" | null;
  seriesName: string | null;
  authorDisplayName: string | null; // da collection authors al momento dell'index
  coverImageGatewayUrl: string | null; // cache gateway cover (opzionale v1)
};
```

Aggiungere al documento Mongoose (`lib/db/models/work.model.ts`) con indici dedicati.

### Indici MongoDB

| Indice | Campi | Uso |
| --- | --- | --- |
| Catalog list | `{ active: 1, createdAt: -1 }` | Lista default |
| Author filter | `{ active: 1, author: 1, createdAt: -1 }` | Filtro autore |
| Language filter | `{ active: 1, language: 1, createdAt: -1 }` | Filtro lingua |
| Text search (v1) | `{ title: "text", authorDisplayName: "text" }` | `$text` su q |
| Series | `{ active: 1, seriesName: 1 }` | Filtro serie (sparse) |

**Migrazione:** script `scripts/backfill-work-catalog-projection.ts` che, per ogni work attivo,
scarica metadata ACE via gateway (Arweave / legacy IPFS) una volta e popola i campi
(eseguibile manualmente post-deploy).

### Nessuna nuova collection obbligatoria

La collection `works` esistente basta. Opzionale v2: collection `catalog_facets` per conteggi
aggregati (lingue disponibili) — **fuori scope v1**; v1 calcola facet lingue con `$group` cached
o lista statica da query distinct limitata.

---

## Contratto dominio

### Filtri e paginazione

```ts
export type WorkAvailabilityFilter = "all" | "openEdition" | "soldOut" | "hasCopiesLeft";

export type WorkListSort = "newest" | "oldest" | "titleAsc" | "titleDesc";

export type WorkListFilter = {
  q?: string;                       // max 120 chars, trimmed
  author?: string;                  // 0x… normalized
  language?: string;              // es. "it", "en"
  availability?: WorkAvailabilityFilter;
  editionKind?: "first" | "reprint";
  seriesName?: string;              // max 120 chars
  sort?: WorkListSort;
  page?: number;                    // 1-based, default 1
  pageSize?: number;                // default da env, max 100
};

export type PaginatedWorks<T> = {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};
```

### Repository port (estensione)

```ts
export type WorkRepository = {
  // … metodi esistenti …
  listWorks(filter?: WorkListFilter): Promise<WorkRecord[]>;
  countWorks(filter?: Omit<WorkListFilter, "page" | "pageSize" | "sort">): Promise<number>;
};
```

Implementazioni: `mongo-work-repository.ts`, `in-memory-indexer-repositories.ts` (fake allineato
al contratto Mongo).

### Catalog service

```ts
listPublicWorksPage(
  repositories: CatalogRepositories,
  filter: WorkListFilter,
): Promise<PaginatedWorks<PublicWorkDto>>;
```

- Applica sempre `active: true`.
- Mappa `WorkRecord` → `PublicWorkDto` (logica esistente).
- `getPublicWork` invariato.

---

## API pubblica

### `GET /api/works`

**Auth:** nessuna. **Permesso:** implicito `pages:read` (route pubblica).

**Query params** (validati con Zod in `lib/works/catalog-query-schema.ts`):

| Param | Tipo | Default | Note |
| --- | --- | --- | --- |
| `q` | string | — | Escape regex; o `$text` se indice presente |
| `author` | string | — | `0x` + 40 hex, lowercase |
| `language` | string | — | 2–32 chars |
| `availability` | enum | `all` | |
| `editionKind` | enum | — | |
| `seriesName` | string | — | exact match case-insensitive v1 |
| `sort` | enum | `newest` | |
| `page` | int | `1` | min 1 |
| `pageSize` | int | `CATALOG_PAGE_SIZE` | min 1, max 100 |

**Response 200:**

```json
{
  "works": [ /* PublicWorkDto[] */ ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 142,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**Errori:** `422` payload non valido; `429` rate limit; `500` messaggio generico (no stack, no
`MONGODB_URI`).

### `GET /api/works/[workId]`

Invariato (dettaglio singola opera).

### Env

| Variabile | Scope | Default | Descrizione |
| --- | --- | --- | --- |
| `CATALOG_PAGE_SIZE` | server | `20` | Page size default API e UI |
| `CATALOG_RATE_LIMIT_WINDOW_MS` | server | `60000` | Finestra rate limit |
| `CATALOG_RATE_LIMIT_MAX` | server | `120` | Max richieste / IP / finestra |

---

## Sicurezza server

Misure obbligatorie per ogni endpoint e query Mongo del catalogo:

| Minaccia | Mitigazione |
| --- | --- |
| **NoSQL injection** | Query costruite solo da oggetti tipizzati post-Zod; vietato passare input utente come operatori `$` |
| **ReDoS / regex abuse** | Ricerca testuale via `$text` o `escapeRegex(q)` + lunghezza max 120 |
| **Parameter tampering** | Zod strict; `pageSize` capped; `page` max derivato da `totalPages` |
| **Scraping / DoS** | `enforceRateLimit(request, "catalog-list")` su `GET /api/works` (pattern `lib/authors/api-utils.ts`) |
| **Enumeration autori** | Lista autori filtrabili solo indirizzi già presenti in opere pubbliche (no leak utenti piattaforma) |
| **Information disclosure** | Errori generici client; log strutturato server-side (`server-logger`) |
| **Cache poisoning** | `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` su risposte identiche (no PII) |
| **Header injection** | Nessun header derivato da input utente |

Validazione Zod **prima** del service layer; rifiuto con `422` e codice i18n `catalog.errors.invalidQuery`.

---

## Architettura (clean architecture)

```
UI (CatalogPageClient, WorksCatalog, …)
    → app/[locale]/works/page.tsx (SSR shell + searchParams)
    → GET /api/works (Route Handler)
        → catalog-query-schema.ts (Zod)
        → enforceRateLimit
            → catalog-service.ts
                → WorkRepository port
                    → mongo-work-repository.ts
                        → work.model.ts (indici + projection)
```

- **Dominio** (`lib/works/*`): niente import Mongoose/React.
- **Indexer** (`lib/indexer/*`): popola campi denormalizzati su `upsertWork`.
- **Publish flow** (opzionale commit in PR 2): backfill projection da metadata già pinato al
  register, per ridurre lag tra register e indexer.

---

## i18n

Nuove chiavi sotto `catalog.*` in tutte le locale (`en`, `it`, …):

| Chiave | Esempio EN |
| --- | --- |
| `catalog.search.placeholder` | Search by title or author… |
| `catalog.search.submit` | Search |
| `catalog.filters.title` | Filters |
| `catalog.filters.author` | Author |
| `catalog.filters.language` | Language |
| `catalog.filters.availability` | Availability |
| `catalog.filters.editionKind` | Edition |
| `catalog.filters.series` | Series |
| `catalog.filters.reset` | Reset filters |
| `catalog.filters.all` | All |
| `catalog.availability.openEdition` | Open edition |
| `catalog.availability.soldOut` | Sold out |
| `catalog.availability.hasCopiesLeft` | Copies available |
| `catalog.pagination.summary` | Showing {from}–{to} of {total} |
| `catalog.pagination.previous` | Previous |
| `catalog.pagination.next` | Next |
| `catalog.results.none` | No works match your filters. |
| `catalog.errors.loadFailed` | Could not load the catalog. |
| `catalog.errors.invalidQuery` | Invalid search parameters. |

Riuso chiavi esistenti dove possibile (`catalog.empty`, `catalog.openEdition`, …).

---

## Test e coverage

Soglia **≥ 80%** (lines, functions, branches, statements) su `apps/web/vitest.config.ts`.

| Area | Tipo test | File indicativi |
| --- | --- | --- |
| Query parsing / URL state | Unit | `catalog-query.test.ts`, `catalog-url-state.test.ts` |
| Zod schema | Unit | `catalog-query-schema.test.ts` |
| Catalog service paginato | Unit + in-memory repo | `catalog-service.test.ts` |
| Mongo adapter filtri | Integration (MongoMemoryServer) | `mongo-work-repository.test.ts` |
| API route | Integration | `works-api.test.ts` (extend) |
| Rate limit / 422 | Unit mock request | `works-api.test.ts` |
| Componenti catalogo | jsdom + I18nProvider | `CatalogFiltersPanel.test.tsx`, … |

Aggiornare `coverage.include` in `vitest.config.ts` per:

- `src/lib/works/catalog-query*.ts`
- `src/components/works/Catalog*.tsx` (se contengono logica non banale)

Eseguire `pnpm web:test:coverage` a fine ogni PR.

---

## Piano PR e commit

### PR 1 — Dominio query catalogo e contratto repository

**Obiettivo:** tipi, Zod, service paginato e fake in-memory — **senza** UI né Mongo reale.

**Dipende da:** catalogo MVP esistente (PR 9 web3).

#### Commit 1 — Tipi filtro e paginazione

`feat(web): add catalog list filter and pagination types`

- `lib/works/catalog-types.ts`: `WorkListFilter`, `PaginatedWorks`, `WorkAvailabilityFilter`, `WorkListSort`.
- `lib/works/types.ts`: estendere `WorkRecord` con campi projection opzionali (backward compatible).

#### Commit 2 — Schema Zod query

`feat(web): add Zod schema for catalog API query params`

- `lib/works/catalog-query-schema.ts`: parse + normalize (lowercase author, trim q).
- `escapeRegex` helper condiviso o in `lib/security/escape-regex.ts`.
- Test: input validi, rifiuto pageSize > 100, q troppo lungo.

#### Commit 3 — Estensione port e fake in-memory

`feat(web): extend work repository with filtered paginated list`

- `ports/work-repository.ts`: `listWorks(filter)`, `countWorks(filter)`.
- `testing/in-memory-indexer-repositories.ts`: implementazione filtri + sort + slice pagina.
- Test fake: filtro autore, availability soldOut, paginazione.

#### Commit 4 — Catalog service paginato

`feat(web): add paginated listPublicWorksPage to catalog service`

- `catalog-service.ts`: `listPublicWorksPage`; deprecare uso diretto di `listPublicWorks` bulk in nuovo codice.
- `catalog-query.ts`: pure functions availability → query predicate (condiviso Mongo/in-memory).
- Test service: totalPages, filtro lingua, sort titleAsc.

**Definition of done (PR 1):** dominio testabile al 80%+ senza Mongo; `pnpm web:test:coverage` verde.

---

### PR 2 — Persistenza Mongo, indici e denormalizzazione indexer

**Obiettivo:** campi ricercabili su `works`, adapter Mongo, backfill script.

**Dipende da:** PR 1.

#### Commit 1 — Schema Mongoose e indici

`feat(web): add catalog projection fields to work model`

- `work.model.ts`: `title`, `language`, `editionKind`, `seriesName`, `authorDisplayName` (+ indici).
- `mappers.ts`: mapping documento ↔ dominio.
- Test mapper.

#### Commit 2 — Adapter Mongo filtrato

`feat(web): implement filtered work listing in mongo adapter`

- `mongo-work-repository.ts`: query builder tipizzato; `$text` o regex escaped; count + find skip/limit.
- Test MongoMemoryServer: paginazione, filtro author, active-only.

#### Commit 3 — Denormalizzazione in indexer

`feat(web): populate catalog projection fields on work upsert`

- `chain-indexer.ts` / handler register: estrae campi da metadata ACE (fetch gateway
  server-side una volta all’index) + lookup `authors.displayName`.
- Test indexer con metadata fixture (no gateway reale).

#### Commit 4 — Script backfill opere esistenti

`chore(web): add script to backfill work catalog projection`

- `scripts/backfill-work-catalog-projection.ts`: idempotente; dry-run flag.
- Documentazione comando in `documentation/blockchain/commands.md` (sezione catalogo).

**Definition of done (PR 2):** opere indicizzate hanno `title`/`language`; query Mongo < 100ms su dataset dev; test adapter verdi.

---

### PR 3 — API pubblica catalogo e hardening sicurezza

**Obiettivo:** `GET /api/works` con query params, rate limit, errori sicuri.

**Dipende da:** PR 2.

#### Commit 1 — Route handler paginato

`feat(web): add paginated query params to GET /api/works`

- `app/api/works/route.ts`: parse Zod → `listPublicWorksPage` → JSON `{ works, pagination }`.
- Header cache pubblici.
- Test API: pagina 2, filtro language, 422 su param invalido.

#### Commit 2 — Rate limiting catalogo

`feat(web): rate limit public catalog list API`

- `enforceRateLimit` con chiave `catalog-list:{ip}` e env configurabili.
- Test 429 mock.

#### Commit 3 — Allineamento env e config page size

`feat(web): add catalog page size server config`

- `lib/works/catalog-config.ts`: `getCatalogPageSize()` da `CATALOG_PAGE_SIZE`.
- `.env.example` + README tabella env.

#### Commit 4 — Deprecare list bulk nella pagina SSR

`refactor(web): stop loading all works in works page server component`

- Rimuovere loop IPFS N+1 da `works/page.tsx` (preparazione PR 4); temporaneamente pagina vuota
  con TODO o redirect a client-only fino a PR 4 — **oppure** fetch prima pagina server-side con
  nuovo service (preferito: SSR prima pagina + client per filtri).

**Definition of done (PR 3):** API documentata; nessun leak stack; rate limit attivo; test API ≥ 80%.

---

### PR 4 — UI catalogo: ricerca, filtri, paginazione

**Obiettivo:** esperienza utente completa secondo specifiche.

**Dipende da:** PR 3.

#### Commit 1 — URL state e hook fetch

`feat(web): add catalog URL state and client fetch hook`

- `catalog-url-state.ts`: sync `searchParams` ↔ filtri.
- `useCatalogWorks.ts`: fetch `/api/works` (pattern simile a `LibraryClient`).
- Test pure URL state.

#### Commit 2 — Barra di ricerca

`feat(web): add catalog search bar component`

- `CatalogSearchBar.tsx`: debounce 300ms, submit, accessibilità (`aria-label`).
- Test componente.

#### Commit 3 — Pannello filtri sidebar

`feat(web): add catalog filters sidebar`

- `CatalogFiltersPanel.tsx`: autore, lingua, disponibilità, edizione, serie, reset.
- Layout responsive: drawer su mobile.
- Test filtri + reset.

#### Commit 4 — Paginazione

`feat(web): add catalog pagination controls`

- `CatalogPagination.tsx`: prev/next, summary i18n, disabilitazione bordi.
- Test edge cases (pagina 1, ultima pagina).

#### Commit 5 — Integrazione pagina `/works`

`feat(web): wire catalog page with search filters and pagination`

- `CatalogPageClient.tsx` + refactor `works/page.tsx` (SSR metadata + client island).
- Estendere `WorksCatalog` per stati loading / error / no-results.
- Test integrazione `WorksCatalog` / `CatalogPageClient`.

**Definition of done (PR 4):** UX conforme mock layout; URL condivisibile con filtri; mobile usabile.

---

### PR 5 — i18n, accessibilità, coverage e documentazione

**Obiettivo:** chiudere il cerchio qualità e docs.

**Dipende da:** PR 4.

#### Commit 1 — Traduzioni catalogo

`feat(web): internationalize catalog search filters and pagination`

- Chiavi `catalog.*` in tutte le locale.
- `nav-i18n.test.ts` aggiornato.

#### Commit 2 — Accessibilità e SEO

`feat(web): improve catalog a11y and localized metadata`

- Focus management su cambio pagina; landmark `search` / `navigation`.
- `generateMetadata` con query disabilitata (canonical `/works`); optional `noindex` su pagine
  `?page=>1` se necessario SEO.

#### Commit 3 — Coverage threshold

`test(web): extend vitest coverage for catalog modules`

- `vitest.config.ts`: include nuovi moduli `lib/works/catalog-*` e componenti catalogo.
- `pnpm web:test:coverage` ≥ 80%.

#### Commit 4 — Documentazione

`docs: add catalog implementation plan and operator notes`

- Completare questo file con eventuali aggiustamenti post-implementazione.
- README: paragrafo breve su catalogo e env `CATALOG_PAGE_SIZE`.

**Definition of done (PR 5):** 9 locale complete; coverage verde; checklist sicurezza soddisfatta.

---

## Checklist sicurezza pre-merge (ogni PR)

1. Validazione Zod su ogni input HTTP del catalogo.
2. Nessun segreto (`MONGODB_URI`, chiavi IPFS) in risposta o log client.
3. Rate limit su `GET /api/works`.
4. Query Mongo solo da campi allowlisted post-validazione.
5. Unit test su path di errore (422, 429) oltre al happy path.
6. `pnpm web:test:coverage` ≥ 80% sulle aree incluse.

---

## Definition of done globale

- [ ] Pagina `/works` consultabile da tutti i ruoli, con wallet connesso o meno.
- [ ] Barra ricerca + sidebar filtri (autore, lingua, disponibilità, edizione, serie).
- [ ] Lista paginata a 20 opere/pagina (configurabile via `CATALOG_PAGE_SIZE`).
- [ ] API `GET /api/works` paginata e filtrata; dettaglio `/api/works/[workId]` invariato.
- [ ] Campi catalogo denormalizzati su Mongo; indexer popola projection.
- [ ] Misure anti-abuso (rate limit, cap pageSize, escape ricerca).
- [ ] i18n completo; test ≥ 80% coverage sul codice nuovo.
- [ ] Nessuna regressione su mint, library, publish autore.

---

## Evoluzioni future (fuori scope)

- Autocomplete autori con display name (API `/api/catalog/authors`).
- Facet count (opere per lingua) cached.
- Ordinamento per prezzo MATIC.
- Full-text search dedicato (Atlas Search / Elasticsearch).
- Redirect `/catalog` → `/works` per URL marketing.
