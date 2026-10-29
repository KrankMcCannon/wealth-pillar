# Financial integrity integration tests

These tests exercise the real repositories and use cases against PostgreSQL,
including transfer reconciliation, rollback, concurrent edits/deletes, idempotent CSV
imports using the production partial unique index, historical snapshots with 12,000 rows,
concurrent budget period operations, rollback of neighboring date edits, and complete
budget totals under narrow report filters and overflowing transaction lists, and
validated preference updates with rejected ownership changes.

Create a dedicated empty local database, then run:

```sh
createdb wealth_pillar_test
DATABASE_URL=postgres://localhost/wealth_pillar_test pnpm test:integration
```

The configuration accepts only a loopback host and the database name
`wealth_pillar_test`. The suite creates and removes its own `accounts`,
`transactions`, `budget_periods` and `user_preferences` fixture tables. It does not load the app's `.env`
or use Supabase. Run these tests separately from the unit suite (`pnpm test`).
