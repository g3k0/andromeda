# Gestione database MongoDB

------

## Gestione dell'istanza MongoDB locale (comandi systemd)

| Operazione                                                   | Comando                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------ |
| Avviare il servizio                                          | `sudo systemctl start mongod`                                |
| Fermare il servizio                                          | `sudo systemctl stop mongod`                                 |
| Riavviare il servizio                                        | `sudo systemctl restart mongod`                              |
| Verificare lo stato                                          | `sudo systemctl status mongod`                               |
| Abilitare l'avvio automatico (all'accensione del PC)         | `sudo systemctl enable mongod`                               |
| Disabilitare l'avvio automatico                              | `sudo systemctl disable mongod`                              |
| Visualizzare gli ultimi log (50 righe)                       | `sudo journalctl -u mongod -n 50 --no-pager`                 |
| Correggere i permessi delle directory (se il servizio fallisce) | `sudo chown -R mongodb:mongodb /var/lib/mongodb /var/log/mongodb` |

**Nota importante:** Non utilizzare mai il comando `mongod` da solo da terminale. Usa sempre i comandi `systemctl` con `sudo`. L'avvio manuale diretto crea file con permessi sbagliati (proprietario `root` invece di `mongodb`) e impedisce al servizio systemd di funzionare correttamente.



## Gestione utenze database

### Creare database e utente (sviluppo locale)

```shell
use andromeda
db.createUser(
  {
    user: "app_andromeda",
    pwd: passwordPrompt(),
    roles: [
      { role: "readWrite", db: "andromeda" },
      { role: "dbAdmin", db: "andromeda" }
    ]
  }
)
```

### Connection string (non committare)

Inserisci la connection string in `apps/web/.env.development.local` o `apps/web/.env.local`
(entrambi gitignored). Template in `apps/web/.env.development.local.example`:

```
mongodb://<user>:<password>@127.0.0.1:27017/andromeda?authSource=andromeda
```

## Collezioni

L'app usa Mongoose (`apps/web/src/lib/db/models/`). Al primo avvio le collection vengono create
automaticamente; i comandi sotto servono per preparare manualmente schema, indici e dati di test.

| Collection (Mongoose) | Modello | Uso |
| --- | --- | --- |
| `roles` | `Role` | Ruoli di sistema e custom; subset di permessi dal catalogo in codice |
| `users` | `User` | Identità piattaforma, `roleSlug`, override permessi, preferenze |
| `authors` | `Author` | Profili autore pubblici |
| `walletpreferences` | `WalletPreferences` | **Deprecata** — preferenze migrate in `users.preferences` |

**Non usare** la collection `author` (singolare): è un residuo da setup manuali errati.
L'app persiste solo su `authors` (vedi `AUTHOR_COLLECTION_NAME` in `author.model.ts`).

#### Rimuovere la collection `author` obsoleta

Se esiste una collection vuota `author`, eliminala dopo aver verificato che i dati
sono in `authors`:

```javascript
use andromeda

db.authors.countDocuments()
db.author.countDocuments()

db.author.drop()
```

Riferimento schema autore: `apps/web/src/lib/db/models/author.model.ts`
(`displayName` max 64 caratteri, `avatarUrl` max 700 000 caratteri).

### Collection `roles`

I documenti ruolo definiscono quali permessi del catalogo applicativo (`USER_PERMISSIONS`
in `apps/web/src/lib/users/types.ts`) sono assegnati a ciascun ruolo. Gli utenti referenziano
un ruolo tramite `users.roleSlug` (es. `"reader"`, `"author"`, `"admin"`).

Campi principali (`apps/web/src/lib/db/models/role.model.ts`):

| Campo | Tipo | Vincoli |
| --- | --- | --- |
| `slug` | `string` | obbligatorio, lowercase, univoco (`reader`, `author`, `admin`, …) |
| `name` | `string` | obbligatorio, etichetta UI |
| `description` | `string` \| `null` | opzionale |
| `permissions` | `string[]` | obbligatorio, valori ⊆ catalogo permessi |
| `isSystem` | `boolean` | `true` per i tre ruoli seed (non eliminabili dall'app) |
| `createdAt` / `updatedAt` | `date` | gestiti da `timestamps: true` |

#### Seed automatico (consigliato)

```bash
pnpm --filter @andromeda/web exec tsx scripts/seed-roles.ts
```

Lo script è idempotente: inserisce i tre ruoli di sistema solo se la collection è vuota.

#### Inserire manualmente i tre ruoli di sistema (mongosh)

Usa questi comandi se preferisci preparare il database a mano prima del deploy dell'app.
Gli slug devono coincidere con quelli attesi da `users.roleSlug` e dallo script di migrazione.

```javascript
use andromeda

const now = new Date()

db.roles.insertMany([
  {
    slug: "reader",
    name: "Reader",
    description: "Default platform reader",
    permissions: [
      "pages:read",
    ],
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    slug: "author",
    name: "Author",
    description: "Author with own profile editing",
    permissions: [
      "pages:read",
      "authors:write:own",
    ],
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    slug: "admin",
    name: "Admin",
    description: "Full platform administration",
    permissions: [
      "pages:read",
      "authors:write:own",
      "authors:write:any",
      "authors:delete:any",
      "users:read",
      "users:write",
      "users:delete",
      "admin:access",
      "roles:read",
      "roles:write",
      "roles:delete",
    ],
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  },
])
```

Verifica:

```javascript
db.roles.find({}, { _id: 0, slug: 1, name: 1, permissions: 1, isSystem: 1 }).sort({ slug: 1 })
db.roles.getIndexes()
```

**Ordine deploy consigliato:** seed `roles` → migrazione `users` (`roleSlug`) → avvio app.
Vedi anche [roles.md](../plans/roles.md).

#### Integrità referenziale `users.roleSlug` → `roles.slug`

L'app applica questi vincoli lato server (non esiste FK nativo in MongoDB):

| Operazione | Regola |
| --- | --- |
| Creazione / aggiornamento utente | `roleSlug` deve corrispondere a un documento esistente in `roles` |
| Eliminazione ruolo custom | Bloccata se almeno un utente ha quel `roleSlug` (`409 Conflict`) |
| Eliminazione ruolo system | Sempre bloccata (`isSystem: true`) |

Prima di eliminare un ruolo custom in mongosh, riassegna gli utenti collegati:

```javascript
db.users.countDocuments({ roleSlug: "moderator" })

db.users.updateMany(
  { roleSlug: "moderator" },
  { $set: { roleSlug: "reader", updatedAt: new Date() } },
)

db.roles.deleteOne({ slug: "moderator", isSystem: false })
```

In produzione usa le API admin (`DELETE /api/roles/:slug`) o il pannello *Roles*: il
controllo sul conteggio utenti è centralizzato in `role-service.deleteRole`.

Se la collection esiste già e vuoi solo aggiornare i permessi di un ruolo (sviluppo):

```javascript
db.roles.updateOne(
  { slug: "admin" },
  {
    $set: {
      permissions: [
        "pages:read",
        "authors:write:own",
        "authors:write:any",
        "authors:delete:any",
        "users:read",
        "users:write",
        "users:delete",
        "admin:access",
        "roles:read",
        "roles:write",
        "roles:delete",
      ],
      updatedAt: new Date(),
    },
  },
)
```

### Collection `users`

Gli utenti referenziano un ruolo con `roleSlug` (non più un campo `role` inline). Migrazione
una tantum da env admin, `authors` e `walletpreferences`:

```bash
pnpm --filter @andromeda/web exec tsx scripts/migrate-users.ts
```

```javascript
use andromeda
db.users.find().pretty()
db.users.getIndexes()
```

### Collection `authors`

Campi allineati al modello Mongoose (`timestamps: true` → `createdAt` e `updatedAt` gestiti
dall'applicazione o inseriti a mano):

| Campo | Tipo | Vincoli |
| --- | --- | --- |
| `address` | `string` | obbligatorio, lowercase, univoco |
| `displayName` | `string` | obbligatorio, max 64 caratteri |
| `avatarUrl` | `string` \| `null` | opzionale, max 700 000 caratteri (data URL validato dall'app) |
| `createdAt` | `date` | obbligatorio |
| `updatedAt` | `date` | obbligatorio |

#### Creare la collection con validatore e indice univoco

```shell
mongosh "mongodb://app_andromeda:<password>@127.0.0.1:27017/andromeda?authSource=andromeda"
```

```javascript
use andromeda

db.createCollection("authors", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["address", "displayName", "createdAt", "updatedAt"],
      properties: {
        address: {
          bsonType: "string",
          description: "Indirizzo Ethereum normalizzato in lowercase (0x + 40 hex).",
        },
        displayName: {
          bsonType: "string",
          maxLength: 64,
        },
        avatarUrl: {
          bsonType: ["string", "null"],
          maxLength: 700000,
        },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
      },
      additionalProperties: false,
    },
  },
  validationLevel: "moderate",
  validationAction: "error",
})

db.authors.createIndex(
  { address: 1 },
  { unique: true, name: "address_unique" },
)
```

Se la collection esiste già (es. creata da Mongoose senza validatore), puoi applicare solo
l'indice univoco:

```javascript
db.authors.createIndex(
  { address: 1 },
  { unique: true, name: "address_unique" },
)
```

#### Inserire un profilo autore di esempio (sviluppo)

L'indirizzo deve essere lowercase. Senza un profilo in `authors`, `/author/<address>` restituisce
«not found».

```javascript
db.authors.insertOne({
  address: "0xabcdef0123456789abcdef0123456789abcdef01",
  displayName: "Jane Doe",
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
})
```

Verifica:

```javascript
db.authors.findOne(
  { address: "0xabcdef0123456789abcdef0123456789abcdef01" },
  { _id: 0 },
)
```

Pagina corrispondente in locale: `http://localhost:3000/author/0xabcdef0123456789abcdef0123456789abcdef01`

### Produzione

- Usa un utente applicativo con **solo** `readWrite` sul database `andromeda` — **non** `dbAdmin`.
- Abilita **TLS** nella connection string (`mongodb+srv://` su Atlas o `tls=true` dove supportato).
- Conserva `MONGODB_URI` solo in secrets del deploy (Vercel, ecc.); non committare credenziali.
- Limita l'accesso di rete (IP allowlist o VPC) quando il provider lo supporta.

