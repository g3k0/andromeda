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
    user: "andromeda",
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

### Produzione

- Usa un utente applicativo con **solo** `readWrite` sul database `andromeda` — **non** `dbAdmin`.
- Abilita **TLS** nella connection string (`mongodb+srv://` su Atlas o `tls=true` dove supportato).
- Conserva `MONGODB_URI` solo in secrets del deploy (Vercel, ecc.); non committare credenziali.
- Limita l'accesso di rete (IP allowlist o VPC) quando il provider lo supporta.

