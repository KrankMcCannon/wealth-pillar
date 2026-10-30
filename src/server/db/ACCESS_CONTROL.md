# Accesso al database

Wealth Pillar autentica gli utenti con Clerk e applica i permessi nelle Server
Actions. I browser non interrogano direttamente Supabase. Drizzle usa il ruolo
`pool_user` tramite il pooler; l'onboarding e i job di mercato usano `service_role`.
Entrambi i ruoli backend hanno `BYPASSRLS` e devono restare esclusivamente sul server.

## Audit e correzione del 30 ottobre 2026

L'audit in sola lettura del progetto Wealth Pillar ha confermato:

- RLS attiva su `transactions`, con una policy permissiva `USING (true)`.
- Privilegi CRUD per `anon` e `authenticated` su tabelle e viste pubbliche.
- 29 funzioni `SECURITY DEFINER` eseguibili da entrambi i ruoli client, comprese
  funzioni su movimenti, utenti, gruppi e conti.
- Privilegi espliciti sulle tabelle e bypass RLS per `pool_user`; nessuna
  appartenenza dei ruoli client a quello backend.

La migrazione [0009_server_only_data_access.sql](drizzle/0009_server_only_data_access.sql)
è stata applicata al progetto Supabase il 30 ottobre 2026. Revoca l'accesso allo
schema `public`, alle tabelle, alle viste, alle sequenze e alle funzioni per i ruoli
client e `PUBLIC`, rimuove la policy permissiva e corregge i privilegi predefiniti
di `postgres`. Preserva esplicitamente `pool_user` e `service_role`.

La revoca sullo schema protegge anche da futuri oggetti creati con i default dei
ruoli gestiti da Supabase. Le funzioni dell'estensione `pg_trgm`, possedute da un
ruolo gestito, possono conservare grant `EXECUTE`: i ruoli client non possono
risolverle nello schema `public`. Non vengono modificate estensioni o altri schemi.

Verifica successiva all'applicazione:

- Nessun accesso client allo schema; nessun grant CRUD su tabelle o viste pubbliche.
- Nessuna funzione `SECURITY DEFINER` pubblica eseguibile dai ruoli client.
- Policy permissiva rimossa; RLS sulle transazioni ancora attiva.
- Accesso allo schema e privilegi contabili conservati per entrambi i ruoli backend.
- Query `WHERE false` riuscite con le credenziali reali `pool_user` su movimenti,
  conti e utenti; richieste HEAD riuscite con `service_role` su onboarding e titoli.
- Scomparse entrambe le segnalazioni advisor relative alle RPC privilegiate
  [anonime](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
  e [autenticate](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

Non sono state lette o modificate righe finanziarie durante l'audit e la migrazione.
L'ispezione del catalogo e degli advisor conferma i permessi; non è una verifica
di eventuali accessi avvenuti prima della correzione.

## Verifiche ripetibili

Eseguire [scripts/audit-database-access.sql](../../../scripts/audit-database-access.sql)
con una connessione amministrativa. Lo script restituisce solo metadati.

La suite `tests/integration/database-access.test.ts` verifica su PostgreSQL locale
il rifiuto di SELECT, INSERT, UPDATE, DELETE, viste e RPC per entrambi i ruoli
client, l'accesso backend, i privilegi sui nuovi oggetti e la ripetibilità della
migrazione. Le fixture e i ruoli vengono annullati tramite rollback.

La migrazione è idempotente: può essere rieseguita dal journal Drizzle con una
connessione amministrativa `postgres` dopo l'applicazione tramite Supabase. Le
credenziali runtime `pool_user` non sono credenziali per modificare ownership o
privilegi predefiniti di `postgres`. Nessuna nuova variabile runtime è necessaria.
Lo snapshot `0004_snapshot.json` usa l'indice 4 del journal; la migrazione SQL usa
il nome `0009` per proseguire la numerazione dei file già presenti.

Per riaprire un accesso browser in futuro servono grant espliciti, policy coerenti
con Clerk e test tra gruppi. Non ripristinare la policy `true` o i grant globali.

Gli advisor segnalano ancora problemi preesistenti fuori da questo intervento:
[search_path delle funzioni](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable),
[estensione nello schema pubblico](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public)
e [aggiornamento PostgreSQL](https://supabase.com/docs/guides/platform/upgrading).
Le segnalazioni sulle impostazioni Supabase Auth non descrivono il login Clerk.
