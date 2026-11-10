# Database consolidation: release procedure

This is a preparation and review procedure, not authorization to change a hosted
database, provision paid features, modify Netlify, or deploy. Use a separate
Preview database first. Never print URLs, credentials, SQL parameters or financial
rows in logs or tickets.

## Before any hosted change

1. Record the exact app commit, approved rollback commit and migration manifest.
   Run typecheck, lint, financial calendar, unit, PostgreSQL 17 integration,
   production build and authenticated E2E against disposable local databases.
2. Verify current Supabase version, direct endpoint, catalog and legacy journal.
   Investigate catalog differences; do not edit the expected snapshot to make an
   unexplained difference pass. Confirm a restorable backup and recovery owner.
3. Review aggregate preflight failures from migration 0001 and agree how to repair
   each cause separately; do not silently rewrite financial records. The
   transaction rolls back on any failure. Its locks and statement timeout can
   interrupt busy workloads; choose a maintenance window and observe blockers.
   The preflight compares the legacy group-member array with `users.group_id`;
   later membership changes maintain the legacy array for rollback compatibility.
4. Verify the Netlify plan supports the Frankfurt Functions region, connection
   budget and direct network path. DNS previously returned IPv6 only for the
   direct endpoint; verify IPv6 and TLS in the deployed Preview. If the path needs
   the paid IPv4 add-on, obtain explicit cost approval before enabling it.
5. Configure a Preview with separate test data and secrets, then validate region,
   certificate, repeated warm invocations, connections, permissions, recovery and
   server-side p95. Compare against an equivalent pre-change workload. The local
   benchmark alone is not a serverless capacity certification.

## Existing database, after explicit authorization

Set `DATABASE_ADMIN_URL` through a protected administrative environment; do not
place it on the command line. Confirm the intended database using a separately
reviewed identity check before each command. The administrative connection is
separate from `DATABASE_URL`; never use the runtime role for DDL.

1. `pnpm db:adopt` compares the complete expected baseline and adopts it without
   replaying historical DDL. Stop on any drift or unknown journal entry.
2. `pnpm db:prepare-indexes` creates only registered indexes with `CONCURRENTLY`.
   It verifies valid/ready state and exact definitions, and repairs a previously
   interrupted non-constraint index. Stop on divergence or constraint ownership.
3. `pnpm db:migrate` applies each registered migration transactionally, checks the
   resulting catalog and journals its hash. Backfill preflight failures roll the
   transaction back. This can take locks on production tables.
4. `pnpm db:verify` checks the journal and final catalog. Compare association
   backfills and accounting invariants using aggregate-only checks. Keep the legacy
   columns and sync triggers in place for application rollback.
5. With a separately approved deployment, set the Functions region and direct
   runtime URL, deploy, and verify functionality, role grants, TLS and connections.
   Verify the default pool watchdog with Preview fault tests before production;
   enable telemetry for that validation. The
   initial proposed runtime role limit is 30 connections; review all consumers and
   provision it separately using an authorized admin connection. For example,
   after verifying the actual role name and existing limits:

   ```sql
   ALTER ROLE pool_user CONNECTION LIMIT 30;
   ```

   This statement changes a live role and is not executed by repository scripts.

## Stop and recovery

Stop immediately for an accounting divergence, duplicate operation, access across
groups, unexpected catalog state, unbounded connection growth or repeated unknown
outcomes. Preserve operation IDs and logs containing only approved metadata. An
absent receipt is unknown, not proof of failure; do not retry a write with a new
identifier. Use the authenticated lookup and the existing identifier.

For application rollback, restore the approved app version and its matching runtime
configuration while retaining the expansion schema and compatibility triggers.
`DB_RELATIONAL_READS=false` and `DB_DURABLE_OPERATIONS=false` are compatibility
switches for a compatible rollback; do not disable durable commands while clients
still have unresolved operations without a reconciliation plan. Schema rollback or
restoration requires a separately reviewed procedure based on the observed state;
never drop new tables or indexes while the current application uses them. Changes
made by the new application must remain visible to the rollback version before
traffic is switched.

Monitor error codes, p95, open/queued connections, pool retirements, transaction
length, uncertain outcomes, account reconciliation and authorization errors
intensively for the first 24 hours and across at least seven representative days.
The plan's performance and capacity targets are accepted only from the measured
hosted workload, not from configuration values.
