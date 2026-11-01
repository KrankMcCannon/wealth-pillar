# Review generale del 1 novembre 2026

Fonte: [Review progetto Wealth Pillar](https://chatgpt.com/c/6ac55d6f-ffa4-83eb-bb65-7cd5230c8cb9).
Il connettore ha restituito i primi 20.000 caratteri dell'ultimo messaggio, fino alla
sezione sui privilegi Supabase. Non espone offset o streaming del seguito: questa
matrice copre tutte le segnalazioni recuperate, non certifica la parte non accessibile.

| Segnalazione                                                | Correzione trasversale                                                                                                                                                                                                              |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0, periodi di altri gruppi accessibili agli amministratori | Guardie condivise asincrone con verifica degli utenti nel database; test su tutte le 13 action dei periodi. L'identità autorizzativa viene letta dal DB per richiesta.                                                              |
| Totali storici e Rapporti limitati a 5.000 movimenti        | Aggregazione SQL completa per giorno, utente, conti, tipo e categoria. Home, Budget, dettaglio busta, anteprima/chiusura/ricalcolo dei periodi e Rapporti condividono le stesse regole del ledger.                                  |
| Date UTC nel dettaglio periodo                              | Confini espliciti Europe/Rome, estesi anche ad anteprima, periodi adiacenti, cursori e form di transazioni, ricorrenze e investimenti.                                                                                              |
| Memoria proporzionale al ledger completo                    | I calcoli ricevono aggregati con conteggi originali; si memorizzano i view model. Le liste mantengono scansioni a blocchi; la preview di una busta si arresta dopo i movimenti necessari e conserva il totale completo del giorno.  |
| Saldi sovrascritti da risposte obsolete                     | Revisione numerica del saldo gestita da trigger; store condiviso con base autorevole, risposte ordinate per revisione e delta pendenti. Copre create/update/delete, trasferimenti, rollback, refresh e risposte dei conti.          |
| Movimenti senza proprietario leggibili dai membri           | Movimenti amministrativi accessibili solo agli amministratori del gruppo; ownership applicata anche nella query SQL.                                                                                                                |
| Invalidazioni globali                                       | Invalidazioni per gruppo, utente, conto e risorsa; dipendenze dei periodi, delle ricorrenze e dei membri registrate nei rispettivi aggregati. Vale anche per categorie, profili, gruppi e inviti.                                   |
| Snapshot investimenti senza processo di persistenza         | Job giornaliero idempotente dopo il refresh dei prezzi. Lock per utente condiviso con creazione/modifica/eliminazione delle posizioni. Ricostruzione anche dei punti invalidati; nessuna scrittura durante la lettura della pagina. |
| Finestra delle quotazioni limitata                          | Upsert SQL che unisce le date già presenti ai prezzi appena ricevuti. Le giornate con prezzi mancanti e il giorno ancora aperto non vengono salvati come snapshot definitivi.                                                       |
| Budget sovrapposti poco visibili                            | Avviso breve accanto al riepilogo, solo in caso di categorie condivise. Spiegazione estesa nella disclosure.                                                                                                                        |
| Confronto temporale nascosto                                | Intervallo di confronto visibile anche visivamente.                                                                                                                                                                                 |
| Giorno non valido dopo il cambio di frequenza               | Reset sulla data iniziale quando cambia la semantica; valore conservato tra settimanale e bisettimanale.                                                                                                                            |

Ulteriori occorrenze emerse verificando l'intero progetto:

- Cataloghi categorie limitati a sistema e gruppo autenticato, anche nel layout e
  nei metadati delle pagine. La rinomina cambia solo l'etichetta; la chiave durevole
  resta valida in movimenti, ricorrenze e snapshot storici.
- Eliminazioni massive del ledger atomiche con rettifica dei saldi di tutti i conti,
  compresi i trasferimenti. Invalidazioni deduplicate nelle eliminazioni di conti.
- Serializzazione esatta dei bigint anche negli oggetti annidati delle ricorrenze,
  prima del passaggio attraverso cache JSON e Server Actions.
- Il test browser che elimina tutte le buste ripristina la fixture tramite la UI,
  evitando di alterare lo stato atteso dagli scenari successivi.

## Rilascio

1. Applicare **solo** la migrazione
   [`20261101191621_account_balance_versions.sql`](../../src/server/db/drizzle/20261101191621_account_balance_versions.sql)
   con una connessione amministrativa, dentro una transazione (Supabase
   `apply_migration` o Drizzle la gestiscono). Il journal Drizzle di produzione
   risulta storicamente privo delle migrazioni pregresse: non avviare un migrate
   generico senza averlo allineato. Lo script è ripetibile, con lock timeout 2 s e
   statement timeout 30 s; aggiunge un bigint a default costante e un trigger.
   Non cambia saldi o movimenti.
2. Verificare `balance_version bigint NOT NULL DEFAULT 0` su `accounts` e il trigger
   `accounts_balance_version`. I test locali verificano replay, rollback e la
   compatibilità con il trigger reale che riscrive `updated_at = NOW()`.
3. Distribuire l'applicazione dopo la migrazione. Per un rollback dell'app si può
   lasciare colonna e trigger: sono compatibili con la versione precedente. Non
   azzerare le revisioni mentre client della nuova versione sono attivi.
4. Configurare `DATABASE_URL` nei segreti del workflow GitHub dei dati di mercato,
   oltre a `TWELVE_DATA_API_KEY`. Il job usa la connessione backend; non richiede
   le precedenti chiavi Supabase REST. Le variabili runtime dell'app non cambiano.
5. Eseguire il workflow o `pnpm exec tsx scripts/persist-portfolio-snapshots.ts`
   nell'ambiente previsto. Il job ripara lo storico disponibile e omette i giorni
   che non può valorizzare integralmente. Prezzi mai disponibili non vengono inventati.

L'ispezione del database reale in questa attività è stata in sola lettura e ha
verificato il trigger di `updated_at`. La migrazione e il job sono stati verificati
su database locali dedicati; questo documento non dichiara un rilascio in produzione.

## Verifica finale

- 1.031 test unitari superati.
- 74 test PostgreSQL superati su database locale dedicato, inclusi migrazione,
  rollback, concorrenza, isolamento tra gruppi e invocazione del job reale.
- 96 regressioni di calendario superate in ciascuno dei fusi UTC, Europe/Rome e
  America/Los_Angeles; la selezione è inclusa anche nello script CI.
- Intera suite Chromium: 33 test superati, inclusi setup e teardown. La suite
  esegue anche la build di produzione, controlla la persistenza dopo reload e la
  coerenza immediata tra Transazioni, Budget, Home e Conti. Verifiche responsive
  a 320/390/1280 px, italiano/inglese, temi e zoom al 200% incluse.
- TypeScript, ESLint, formattazione dei file modificati e controllo whitespace
  Git superati.
