# Database layer

- **Runtime:** Drizzle ORM + `postgres` (postgres-js) via [`drizzle.ts`](./drizzle.ts). direct endpoint only; see [runtime contract](../../../docs/database-runtime.md).
- **Schema:** [`schema.ts`](./schema.ts) is the **complete introspected schema** (adopted from `pnpm db:pull`): every table, column type, nullability, default, index, foreign key, check constraint, RLS policy and view is modeled. TypeScript property keys are kept in `snake_case` (e.g. `transaction.user_id`) to match the app contract — the migration snapshot is keyed on DB column names, so this has no effect on generated SQL.
- **Relations:** [`relations.ts`](./relations.ts), combined with the tables in [`schema-bundle.ts`](./schema-bundle.ts) and passed to `drizzle()`.
- **Re-introspect:** `pnpm db:pull` (uses the dedicated `DATABASE_ADMIN_URL` per `drizzle.config.ts`). Output lands in `drizzle/`; fold any new fidelity back into `schema.ts` keeping `snake_case` keys.

## Migrations

- **PR #58, notifiche bancarie e riferimenti categorie (3 novembre 2026):**
  seguire la [procedura dedicata](../../../docs/releases/apply-pr58-migrations.md).
  La verifica in sola lettura conferma il journal Drizzle ancora vuoto. Lo script
  preparato applica soltanto 0007 e 0008; non usare il migratore generale prima
  di allineare lo storico già applicato tramite Supabase o SQL amministrativo.

- **Account balance revisions (1 November 2026):**
  [`20261101191621_account_balance_versions.sql`](./drizzle/20261101191621_account_balance_versions.sql)
  adds the monotonic `bigint` revision and a balance trigger. Apply this migration
  in a transaction before deploying its application changes. It leaves all balances
  and ledger entries unchanged and can be replayed. The timestamp prefix keeps it
  distinct from the historical numbered files; journal index is 6.
  [Release and compatibility notes](../../../docs/releases/general-review-fixes.md).

- **Recurring frequencies (1 November 2026):**
  [`0005_recurring_frequencies.sql`](./drizzle/0005_recurring_frequencies.sql) has
  journal index/snapshot 5. Apply only this migration through Supabase's migration
  API for this release; the live Drizzle journal is empty, so a generic
  `pnpm db:migrate` would also attempt historical migrations. The script uses a
  transaction, `NOWAIT`, local timeouts, compatibility checks and row fingerprints.
  It changes no rows and is safe to replay. The guarded manual rollback refuses to
  invalidate `once`/`biweekly` records. See the
  [deployment and rollback runbook](../../../docs/releases/recurring-frequency-migration.md).

- **Access control:** [audit e verifica del 30 ottobre 2026](ACCESS_CONTROL.md).
  `0009_server_only_data_access.sql` chiude gli accessi client allo schema pubblico,
  preservando i due ruoli backend; è già applicata al progetto Supabase.

- Single baseline: [`drizzle/0000_baseline_existing_db.sql`](./drizzle/0000_baseline_existing_db.sql) (no-op `SELECT 1;` — the production schema predates Drizzle) plus [`drizzle/meta/0000_snapshot.json`](./drizzle/meta/0000_snapshot.json), which is historical metadata, not a reproducible empty-database schema.
- Primary keys and unique constraints omitted by the earlier introspection have been aligned in `schema.ts` and the latest `0007` snapshot against catalog metadata read on 9 November 2026. This metadata correction executes no DDL and does not adopt the migration journal. New changes: edit `schema.ts`, run `pnpm db:generate`, review the SQL. Run `pnpm db:migrate` only on a database whose Drizzle journal already matches its applied history; use the release-specific procedure for the current production database.
- RLS-enabled tables without policies (`available_shares`, `budget_periods`, `market_data_cache`, `orphan_users`) are kept on via `.enableRLS()` so Drizzle never emits a `DISABLE ROW LEVEL SECURITY`.

## Known DB-level smells (preserved on purpose)

These are real defaults in the live DB, not introspection artifacts. Fixing them is a data migration, out of scope for schema alignment:

- `accounts.user_ids` / `groups.user_ids` default to `'{""}'` (a one-element array holding an empty string).
- `recurring_transactions.transaction_ids` defaults to `'{"RAY"}'`.

## Gated DDL (do not auto-apply)

Review [`drizzle/pending/0005_gated_index_cleanup.REVIEW.sql`](./drizzle/pending/0005_gated_index_cleanup.REVIEW.sql) against Supabase performance advisors before applying to production.
