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
| `authors` | `Author` | Profili autore pubblici |
| `walletpreferences` | `WalletPreferences` | Preferenze onboarding (es. `declinedAuthorPage`) |

Riferimento schema autore: `apps/web/src/lib/db/models/author.model.ts`
(`displayName` max 64 caratteri, `avatarUrl` max 700 000 caratteri).

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

