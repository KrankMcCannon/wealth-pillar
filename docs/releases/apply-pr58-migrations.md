# Applicare le due migrazioni della PR #58

La verifica in sola lettura del progetto **Wealth Pillar**, effettuata il 3 novembre
2026, ha confermato: tre tabelle bancarie assenti, tre funzioni di protezione categorie
assenti, prerequisiti finanziari presenti e journal `drizzle.__drizzle_migrations` vuoto.
La cronologia Supabase contiene invece migrazioni precedenti già applicate.
Nessuna modifica è stata effettuata al database durante questa verifica.

In questo stato non usare `pnpm db:migrate`: proverebbe anche migrazioni storiche non
registrate in Drizzle. L’indicazione generica nei precedenti runbook viene sostituita
qui da una procedura limitata alle due migrazioni richieste.

## Procedura da Supabase

1. Apri il progetto **Wealth Pillar** nella dashboard Supabase e vai a **SQL Editor → New query**.
2. Apri [pr58-apply.sql](./pr58-apply.sql), copia **l’intero contenuto** e incollalo nella
   query. Esegui come proprietario/amministratore del database, non con la chiave anon
   o con l’utente runtime dell’app.
3. Premi **Run** una sola volta. Non selezionare soltanto una parte del file.
   Lo script applica, in quest’ordine:
   - `src/server/db/drizzle/0007_bank_notifications.sql`;
   - `src/server/db/drizzle/0008_category_reference_guards.sql`.
4. La riga finale deve mostrare i nomi delle tre tabelle e della funzione, senza `null`.
   Lo script controlla inoltre che gli otto trigger di protezione siano abilitati.
5. Dopo il successo puoi pubblicare il codice della PR. Non è necessario impostare
   variabili per i cambi: Frankfurter non richiede una chiave.

Le due migrazioni sono racchiuse in un’unica transazione. Se una delle istruzioni
fallisce, nessuna delle due viene confermata. Il timeout dei lock è di 5 secondi;
se il database è occupato, attendi un momento con meno scritture e rilancia il file
intero. Se la sessione del SQL Editor segnala una transazione interrotta, esegui
`ROLLBACK;` prima di riprovare.

Se il file segnala che gli oggetti esistono già, non forzare un secondo invio e non
cancellare le tabelle. Controlla l’esito della prima esecuzione con la verifica qui
sotto. Lo script rifiuta anche un’installazione parziale: in quel caso va verificato
quale dei due file è già stato applicato prima di procedere.

```sql
SELECT
  to_regclass('public.bank_connections')::text AS bank_connections,
  to_regclass('public.bank_notification_events')::text AS bank_notification_events,
  to_regclass('public.bank_merchant_rules')::text AS bank_merchant_rules,
  to_regprocedure('public.category_reference_keys(uuid)')::text AS category_reference_keys;

SELECT c.relname AS tabella, t.tgname AS trigger, t.tgenabled
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
  AND t.tgname IN ('category_delete_guard', 'category_reference_guard')
ORDER BY c.relname;
```

Il secondo risultato deve contenere otto righe con `tgenabled = O`.

## Alternativa da terminale

Dal ramo della PR, usa una connessione amministrativa diretta/Supavisor in modalità
sessione del progetto. Imposta `MIGRATION_DATABASE_URL` con quella connessione, poi:

```sh
psql "$MIGRATION_DATABASE_URL" -X -v ON_ERROR_STOP=1 \
  -f docs/releases/pr58-apply.sql
```

Non usare la connessione runtime in modalità transaction pooling sulla porta 6543.
Non copiare credenziali nei file versionati o nella chat.

## Storico delle migrazioni

Lo script esegue gli stessi due file già revisionati nella PR; non modifica la
cronologia Drizzle o Supabase e non dichiara applicate le vecchie migrazioni.
Conserva l’esito della query con il rilascio. Prima di usare in futuro il migratore
Drizzle generale, occorre allineare il suo journal con le migrazioni storiche
realmente applicate. Non basta inserire un timestamp recente per saltarle tutte.

Le migrazioni creano strutture e protezioni; non cambiano importi, saldi o movimenti
esistenti. La conversione UI di transazioni, ricorrenze, budget e conti non richiede
altre migrazioni.
