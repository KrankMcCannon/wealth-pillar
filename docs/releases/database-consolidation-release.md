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

## Repeatable isolated Preview validation

Run only against a dedicated Preview database with synthetic fixtures and a
separate local/Preview identity. Confirm the endpoint is the intended Preview,
the database is empty or disposable, PostgreSQL is 17, the app commit and schema
manifest are recorded, and a recovery owner is available. Do not point this
workload at production. Record the app commit, migration manifest, PostgreSQL
version, region, runtime/instance configuration, pool settings, test date, and
whether the run is warm or cold. Never include connection strings or fixture
rows in the report.

Run `pnpm db:benchmark` with `DATABASE_URL` set only in the protected process
environment. The benchmark rejects a nonempty database and uses generated
synthetic data at 10,000, 100,000 and 1,000,000 transaction rows. Its default
concurrency levels are 1, 5, 10, 25 and 50; each operation has one warm-up and
at least 20 measured samples. Record the selected sizes/concurrency, wall-clock
duration, and any interrupted scenarios. Repeat the same matrix against the
equivalent pre-change version and Preview configuration before describing a
percentage improvement. A different region, dataset, concurrency or cache state
is not an equivalent baseline.

For each operation and matrix cell, retain p50/p95/p99 and maximum observed
latency, query counts, errors, total/queued application pool connections and
pool retirements. Reconcile all account balances with the transaction ledger,
and verify that each generated mutation has exactly one committed receipt and
one distinct transaction; count unresolved receipts and duplicate outcomes.
Compare the measured **server-side p95** with the documented 1.5 second goal.
The current local benchmark reports client-observed database operation latency,
not hosted server-side request latency. Obtain hosted p95 from Preview runtime
telemetry. PostgreSQL server execution time is observable only where a query
plan or provider metric reports it; do not relabel round-trip latency as server
execution time. The client pool reports its own total and waiting counts; it
does not report aggregate connections opened by other Preview functions or
services. Mark unavailable measurements as unavailable rather than estimating
them. Record p99 and observed capacity without treating them as approved limits.

Stop the run for any ledger/receipt mismatch, duplicate transaction, unresolved
unknown outcome, cross-group access, unbounded connection growth, repeated
timeouts, or an unexpected schema/catalog difference. Preserve aggregate logs
and operation identifiers only; reconcile an unknown operation by its original
identifier before considering a retry. Do not increase limits or alter database
configuration during the run. A run that stops is inconclusive and must include
the stopping condition and last completed matrix cell.

The local benchmark currently writes `output/database/benchmark.json` and
`explain-*.json`. Treat these as local artifacts: inspect and sanitize before
sharing. The test measures application operations through a local PostgreSQL
client and is useful for repeatability and accounting checks; only the isolated
hosted run validates Preview networking, serverless scaling, aggregate
connections and hosted server-side latency.

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

## Supabase root CA rotation review

Run `pnpm db:check-ca` locally and in the scheduled `Supabase CA expiry` workflow.
It reads only the bundled CA, reports its subject, SHA-256 fingerprint and
remaining validity, and fails when it is expired. A warning begins 180 days
before expiry. This is an expiry check, not a live check of Supabase's current
certificate chain.

At every warning, and whenever Supabase announces a database certificate or CA
rotation, review the current root/intermediate chain from Supabase's verified
documentation or dashboard before changing the bundle. Compare issuer, subject,
validity and fingerprint with the published material; validate the candidate
against an isolated Preview using hostname and certificate verification enabled.
Retain the current CA during a documented overlap only when Supabase's rotation
guidance requires it, then remove retired roots after the chain transition is
verified. Never disable `rejectUnauthorized`, hostname checks, or use a CA copied
from an unverified message or connection error. Record the source and fingerprints
in the change review without recording secrets.
