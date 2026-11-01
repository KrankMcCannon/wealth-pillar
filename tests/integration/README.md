# Financial integrity integration tests

These tests exercise the real repositories and use cases against PostgreSQL,
including every cross-group budget-period action, ownerless transaction visibility, category catalog isolation, durable category keys, complete reports over 5,000 entries with Rome day boundaries, complete idempotent portfolio snapshots and retained quotes, ordered balance revisions, bulk user deletion with transfer reconciliation, cross-group budget/recurring authorization, the recurring-frequency migration and guarded rollback (including forced errors and lock contention),
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
