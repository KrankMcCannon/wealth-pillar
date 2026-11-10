# Database layer

Runtime access uses Drizzle, the pinned Postgres.js client in `drizzle.ts` and the
direct-connection contract in [database-runtime.md](../../../docs/database-runtime.md).
`schema.ts` describes the application tables, keys and indexes; `relations.ts` and
`schema-bundle.ts` provide Drizzle relations. Server authorization and the scope of
RLS are documented in [ACCESS_CONTROL.md](ACCESS_CONTROL.md).

The active migration history is in [`baseline/`](./baseline/). Its first SQL file
reconstructs the verified baseline; later files expand relational associations,
financial operation receipts and indexes. The manifest, hashes and catalog
snapshots are checked by `scripts/db/migrations.mjs`. Previous Drizzle SQL and
snapshots remain under `drizzle/` for historical audit and are not the active
migration path.

On a genuinely empty PostgreSQL 17 database, `pnpm db:migrate` builds the schema.
An existing database requires an exact catalog comparison and explicit
`pnpm db:adopt` before `pnpm db:migrate`; unknown history or drift stops the
process. On an adopted database, `pnpm db:prepare-indexes` creates and verifies
the registered indexes concurrently before the transactional migration. All three
commands use `DATABASE_ADMIN_URL` and should only be run after the checks and
approval described in the [release procedure](../../../docs/releases/database-consolidation-release.md).

For subsequent schema changes, review generated SQL and register the migration and
its verified resulting catalog in the manifest. Unregistered SQL is intentionally
rejected. `pnpm db:generate` alone neither registers nor applies a migration.
Compatibility arrays are retained during expansion for rollback; do not remove
them until the deployed application and rollback path have been verified.
