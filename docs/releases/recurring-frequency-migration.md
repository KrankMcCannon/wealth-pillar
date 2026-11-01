# Recurring frequencies: production migration and rollback

This release changes only `public.recurring_transactions.recurring_transactions_frequency_check`.
It does not update/delete rows, change balances, rebuild tables, alter foreign keys,
or change RLS/grants. The application domain is `once`, `weekly`, `biweekly`,
`monthly`, `yearly`.

## Preflight and execution

1. Confirm the Supabase project is Wealth Pillar (`qnytuypbsnzawodvamjb`). Inspect the
   current validated check and counts grouped by frequency. Existing `daily` or
   `quarterly` rows require a separate compatibility decision; do not convert them.
2. Read the exact SQL from the merged commit:
   `src/server/db/drizzle/0005_recurring_frequencies.sql`. Apply only that file through
   Supabase's migration API, which records the operation in its migration history.
   **Do not run the complete `pnpm db:migrate` batch for this deployment.** The
   production Drizzle journal was empty during preflight, while historical schema
   changes were already recorded in Supabase. Do not backfill migration history
   without a separate audit of those historical changes.
3. Execute in one transaction. `SET LOCAL` limits lock waits to 2 seconds and each
   statement to 15 seconds. `ACCESS EXCLUSIVE NOWAIT` acquires the required DDL lock
   immediately or aborts without queuing behind live traffic. The current table is
   small; if its size has grown substantially, reassess the validation scan first.
4. The script recognizes only the old/new frequency sets and a validated check on
   the frequency column. It refuses unexpected schema drift. It checks row
   compatibility under the lock and fingerprints every existing row before/after
   the DDL; a difference raises an exception and aborts the transaction. Replaying
   an already applied migration is a no-op.
5. After commit, verify the validated check, grouped counts, complete row fingerprint,
   other constraints, indexes, RLS/grants and migration history. Do not insert fake
   financial records into production. Application inserts for all five frequencies
   are covered by the local/CI PostgreSQL suite.

Preflight on 1 November 2026 found 9 rows: 7 monthly, 2 yearly, no legacy-only
frequencies. These observations are not substitutes for the fresh check immediately
before execution. The deployment outcome is recorded on the release PR.

## Failure and rollback

- `55P03`: lock contention. The transaction aborts; inspect activity before retrying.
- `23514`: incompatible existing rows or the row-preservation guard failed. The
  transaction aborts; investigate the data without deleting/converting records.
- `55000`: unexpected/missing/unvalidated constraint. The transaction aborts; inspect
  schema drift rather than replacing an unknown definition.
- Any failure before commit rolls back the DDL and releases the lock. If the client
  loses the response, inspect the constraint and migration history before retrying.

For an explicit schema rollback, use
`src/server/db/drizzle/rollback/0005_recurring_frequencies.sql` in a new transaction
through the Supabase migration API, with a separate rollback migration name. The
script restores the original validated check only if every row is still compatible.
**If `once` or `biweekly` rows now exist, rollback stops and leaves both the current
constraint and all rows untouched.** No automatic mapping or deletion is permitted.

An application rollback can keep the new constraint: the previous application
already offered the same five product frequencies. Restoring the old constraint
would reintroduce the `once`/`biweekly` bug, so it is not an automatic release step.
Do not exercise an up/down cycle against the live database as a test.

The PostgreSQL integration suite verifies successful application, idempotent replay,
legacy-row rejection, an exception after DDL but before commit, successful rollback,
rollback refusal after each newly supported frequency, lock contention and unexpected
schema drift. Row fingerprints and constraint identity are checked after failures.

PostgreSQL references: [LOCK / NOWAIT](https://www.postgresql.org/docs/17/sql-lock.html),
[ALTER TABLE](https://www.postgresql.org/docs/17/sql-altertable.html),
[timeouts](https://www.postgresql.org/docs/17/runtime-config-client.html).
