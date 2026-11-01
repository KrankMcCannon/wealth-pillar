# Database layer

- **Runtime:** Drizzle ORM + `postgres` (postgres-js) via [`drizzle.ts`](./drizzle.ts). `prepare: false` for the Supabase transaction pooler (port 6543).
- **Schema:** [`schema.ts`](./schema.ts) is the **complete introspected schema** (adopted from `pnpm db:pull`): every table, column type, nullability, default, index, foreign key, check constraint, RLS policy and view is modeled. TypeScript property keys are kept in `snake_case` (e.g. `transaction.user_id`) to match the app contract — the migration snapshot is keyed on DB column names, so this has no effect on generated SQL.
- **Relations:** [`relations.ts`](./relations.ts), combined with the tables in [`schema-bundle.ts`](./schema-bundle.ts) and passed to `drizzle()`.
- **Re-introspect:** `pnpm db:pull` (uses `DATABASE_URL` with direct port 5432 per `drizzle.config.ts`). Output lands in `drizzle/`; fold any new fidelity back into `schema.ts` keeping `snake_case` keys.

## Migrations

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

- Single baseline: [`drizzle/0000_baseline_existing_db.sql`](./drizzle/0000_baseline_existing_db.sql) (no-op `SELECT 1;` — the production schema predates Drizzle) plus [`drizzle/meta/0000_snapshot.json`](./drizzle/meta/0000_snapshot.json), which captures the live DB exactly.
- `pnpm db:generate` against the current `schema.ts` reports **"No schema changes"** — schema and snapshot are in sync. New changes: edit `schema.ts`, run `pnpm db:generate`, review the SQL, then `pnpm db:migrate`.
- RLS-enabled tables without policies (`available_shares`, `budget_periods`, `market_data_cache`, `orphan_users`) are kept on via `.enableRLS()` so Drizzle never emits a `DISABLE ROW LEVEL SECURITY`.

## Known DB-level smells (preserved on purpose)

These are real defaults in the live DB, not introspection artifacts. Fixing them is a data migration, out of scope for schema alignment:

- `accounts.user_ids` / `groups.user_ids` default to `'{""}'` (a one-element array holding an empty string).
- `recurring_transactions.transaction_ids` defaults to `'{"RAY"}'`.

## Gated DDL (do not auto-apply)

Review [`drizzle/pending/0005_gated_index_cleanup.REVIEW.sql`](./drizzle/pending/0005_gated_index_cleanup.REVIEW.sql) against Supabase performance advisors before applying to production.
