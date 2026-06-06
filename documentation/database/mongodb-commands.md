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