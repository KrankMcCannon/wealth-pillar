# Daily Review e segnalazioni dell'8 novembre 2026

## Causa del blocco dei periodi

La lettura del catalogo e dei log, senza esportare movimenti o valori finanziari,
ha rilevato errori `23503` nel trigger `guard_category_reference` durante
l'aggiornamento degli snapshot. Alcuni budget contengono riferimenti a categorie
non più presenti come chiavi, precedenti al vincolo. La chiusura diretta e
l'avvio di un nuovo periodo copiano questi riferimenti e vengono respinti.

La nuova funzione permette soltanto di archiviare riferimenti già presenti nel
budget persistito dello stesso proprietario e gruppo (con lo stesso ID dello
snapshot), oppure nello stato precedente dello stesso periodo. Non introduce
categorie, non elimina riferimenti, non riscrive importi o storico. Le normali
nuove referenze continuano a richiedere una categoria esistente e mantengono i
lock che impediscono cancellazioni concorrenti.

Separatamente, la chiusura leggeva i budget fuori dalla transazione: con il pool
occupato falliva con `QUEUE_TIMEOUT`. Ora avvio e chiusura usano dati freschi sulla
stessa connessione della mutazione.

## Applicazione limitata della migrazione

La migrazione è preparata e verificata su PostgreSQL locale, **non applicata al
progetto reale**. Non usare il migratore generale su un database con journal non
allineato. Non cambiare `DATABASE_URL`, permessi o timeout di produzione insieme
a questo intervento.

1. Verificare nel catalogo la funzione e il trigger attuali:

   ```sql
   SELECT pg_get_functiondef('public.guard_category_reference()'::regprocedure);
   SELECT tgname, tgenabled FROM pg_trigger
   WHERE tgrelid = 'public.budget_periods'::regclass
     AND NOT tgisinternal;
   ```

   La funzione attesa è quella di `0008_category_reference_guards.sql` oppure
   questa stessa correzione, se già applicata. Fermarsi se esistono altre modifiche.

2. Con una connessione amministrativa già verificata, applicare **solo**
   `src/server/db/drizzle/20261108220000_budget_snapshot_legacy_categories.sql`
   in una transazione con `lock_timeout = '5s'`, `statement_timeout = '30s'` e
   arresto al primo errore. Il file sostituisce una sola funzione. I trigger e i
   dati restano esistenti; è ripetibile. L'entry del journal serve ai database
   che hanno già una cronologia allineata, non autorizza a riallineare quello reale.

3. Rileggere la definizione della funzione e lo stato del trigger. Dopo il rilascio
   applicativo, provare l'avvio di un nuovo periodo con l'utente proprietario e
   verificare la presenza di un solo periodo attivo e dello snapshot precedente.
   Se l'esito di una richiesta non è noto, verificare prima lo stato, senza reinvio.

## Rollback

Applicare nella stessa modalità atomica
`src/server/db/drizzle/rollback/20261108220000_budget_snapshot_legacy_categories.sql`.
Ripristina la funzione precedente senza eliminare periodi, snapshot o movimenti.
Le chiusure che copiano riferimenti legacy torneranno a essere rifiutate; gli
snapshot già creati restano conservati. Il test verifica anche questo comportamento.

## Altri interventi e limiti

- Notifiche nel pannello standard delle impostazioni. Categoria per movimento:
  regola appresa, suggerimento valido oppure revisione. Le categorie predefinite
  dei dispositivi precedenti non classificano più nuovi eventi. Nessuna migrazione
  bancaria richiesta; schema e automazioni di invio restano compatibili.
- I form conservano l'operazione ottimistica dopo la scadenza dell'attesa e
  riconciliano l'esito tardivo. Un invio ancora pendente blocca altri invii dello
  stesso tipo nel tab anche dopo la riapertura del form. Non è idempotenza
  persistente tra browser o dopo un ricaricamento completo: nessuna scrittura viene
  ripetuta automaticamente.
- Letture del ledger, conti e catalogo: un solo tentativo aggiuntivo per errori
  transitori di connessione/coda o statement timeout. Le scritture e le query
  dentro una transazione non usano questo meccanismo.
- La segnalazione `retry`/`reset` non è applicabile: Next.js 16.4.3 passa entrambi,
  e documenta `retry` come stabile dalla 16.3. La regressione verifica il pulsante.
- I log ospitati mostrano anche timeout in fase `PARSE` e connessioni interrotte.
  I test locali non certificano il trasporto Supavisor, che costituisce una
  verifica infrastrutturale distinta. La copertura dei flussi Postgres.js 4 usa
  PostgreSQL locale isolato e non richiede progetti o credenziali Supabase.

## Rimozione della categoria dispositivo

La successiva migrazione `20261108230000_remove_bank_default_category.sql` deve
precedere il rilascio del codice che non invia più questa colonna. Rimuove prima
il trigger del dispositivo e i riferimenti nelle funzioni categorie, quindi
elimina la colonna `bank_connections.default_category`. Preserva il fix degli
snapshot budget della migrazione precedente. Non modifica movimenti, saldi o
notifiche. Le migrazioni già applicate restano immutabili.

La modifica è stata verificata su PostgreSQL locale, compresi riapplicazione,
assenza della colonna/trigger e cancellazione di categorie non più referenziate
artificialmente dai dispositivi. Non è stata applicata al database reale.
