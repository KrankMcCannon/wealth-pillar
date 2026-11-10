# Financial integrity integration tests

These tests exercise the real repositories and use cases against PostgreSQL,
including category dependencies across live and historical records with concurrent deletion/reference guards, empty/invalid/unchanged market refreshes, dated EUR/USD portfolio snapshots, every cross-group budget-period action, ownerless transaction visibility, category catalog isolation, durable category keys, complete reports over 5,000 entries with Rome day boundaries, complete idempotent portfolio snapshots and retained quotes, ordered balance revisions, bulk user deletion with transfer reconciliation, cross-group budget/recurring authorization, the recurring-frequency migration and guarded rollback (including forced errors and lock contention),
atomic portfolio history invalidation, authoritative balance responses, bounded ledger
scans preserving PostgreSQL microseconds, transfer reconciliation, rollback, concurrent edits/deletes, idempotent CSV
imports using the production partial unique index, historical snapshots with 12,000 rows,
concurrent budget period operations, rollback of neighboring date edits, and complete
budget totals under narrow report filters and overflowing transaction lists, and
validated preference updates with rejected ownership changes.

They also force both lock orderings between account balance recalculation and
ledger mutations, and verify the server-only database migration against anonymous,
authenticated, service and pooler roles, including views, privileged RPCs and future
objects. Access-control fixtures are fully rolled back, including their roles.

Create a dedicated empty local database, then run:

```sh
createdb wealth_pillar_test
DATABASE_URL=postgres://localhost/wealth_pillar_test pnpm test:integration
```

The configuration accepts only a loopback host and the database name
`wealth_pillar_test`. The suite creates and removes its own `accounts`,
`transactions`, `budget_periods`, `user_preferences` and the resource-isolation fixture tables. It does not load the app's `.env`
or use Supabase. Run these tests separately from the unit suite (`pnpm test`).

## Postgres.js 4 application flows

`pnpm run test:postgres4` runs this full suite with the pinned driver. No hosted
project or real authentication credentials are needed. The continuous regression
in `review-consistency.test.ts` covers Server Actions, persisted ledger rereads,
report totals, the new-period operation, frozen snapshots, account balances and
ordered revisions. Database repositories and financial use cases are not mocked.

## Production-shaped schema

`baseline-migrations.test.ts` verifies empty reconstruction, guarded adoption, concurrent-index catalog equivalence and rejection of drift. `consolidated-financial.test.ts` uses the active migrations and local-only Supabase auth prerequisites for command, authorization, association, reconciliation and keyset checks. Some older integration tests retain narrower fixtures and do not themselves certify the full schema. `transport-recovery.test.ts` injects a lost post-commit response through a local TCP proxy.
