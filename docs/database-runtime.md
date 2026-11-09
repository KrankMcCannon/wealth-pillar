# Database runtime: Postgres.js 4.0

The driver remains pinned to 4.0.0; Drizzle is not upgraded. Runtime persistence
uses the process-wide client in `src/server/db/drizzle.ts`.

## Connection contract

- `DATABASE_URL`: the provider-supplied **direct PostgreSQL** runtime endpoint.
- `DATABASE_ADMIN_URL`: separate administrative credentials for Drizzle tooling and
  the closed-period snapshot maintenance script. Never expose either variable to clients.
- `DIRECT_URL` is not consulted. No code rewrites credentials, hosts or ports.
- Supabase pooler hosts and port 6543 are rejected before connecting, including
  session poolers on port 5432. Remote clients default to certificate-verified TLS.
  Loopback test databases may use plaintext. TLS must be verified from Netlify too.

This is a deployment prerequisite: an existing pooler URL must be replaced with
the actual provider-supplied direct URL before releasing this client. Changing the
code does not configure Netlify, enable IPv4, purchase add-ons or move functions.

Initial per-process profile: `max: 3`, `max_pipeline: 8`, `infer: false`,
`queue_timeout: 2`, `connect_timeout: 5`, `idle_timeout: 20`, `max_lifetime: 300`
(seconds). Queries remain unnamed by default (`prepare: false`); stable prepared
Drizzle queries require separate measurement before adoption. PostgreSQL session
settings use milliseconds: statement 10,000, lock 5,000, idle transaction 15,000,
and timezone UTC. A total transaction/transport deadline and coordinated pool
replacement are not yet implemented. These settings are limits, not certification.

Before activation verify the Netlify plan/region (`fra`), direct endpoint network
reachability and certificate chain, IPv6 or the required IPv4 add-on, runtime role
permissions and an aggregate connection budget. A reviewed administrative change
may set `ALTER ROLE pool_user CONNECTION LIMIT 30`; this repository does not apply
that change automatically. Never provision this limit using runtime credentials.

## Precision and recovery

Ledger balance mutations parse persisted EUR decimals to bigint cents, accumulate
exact deltas and serialize decimal strings into numeric SQL parameters. Invalid
values or fractional cents fail instead of becoming zero. Account recalculation
uses a complete SQL aggregate after locking the account row, at READ COMMITTED.
Presentation types and investment calculations still have number-based paths;
this is not a completed migration of all financial arithmetic.

`readWithRetry` is only for autonomous reads: at most one additional attempt with
100–200ms jitter for transient connection/transport failures. It does not retry
queue saturation, statement cancellation/timeouts, writes or active transactions.
Callers may provide an epoch-millisecond deadline; no retry starts if fewer than
five seconds plus backoff remain. An omitted deadline does not establish a global
request deadline. UI timeouts do not prove a write failed. Persistent operation
identity and authenticated recovery after an uncertain commit remain outstanding.

## Opt-in metrics

Set `DB_TELEMETRY_ENABLED=true` to subscribe once per process to native Postgres.js
query, connection, transaction and pool diagnostics. The sink emits JSON with an
explicit scalar allowlist: query duration, pool wait, round trip, returned row
count, SQLSTATE/driver code, connection/transaction duration and pool occupancy.
It excludes SQL text, parameters, result values, hosts, database/user names and
error messages. Sink failures cannot change a financial result.

Dashboard operations currently attach a generated correlation id and operation
summary (query count, sum of query durations and wall time). The sum can exceed
wall time for parallel queries. Round trip includes network/protocol time and is
not PostgreSQL execution time. Environment/release come from Netlify `CONTEXT`
and `COMMIT_REF`. Full action/request propagation, cache hit/miss, transformation
and payload-byte metrics are not yet covered.

## Verification and remaining rollout gates

Use `tests/integration/README.md` for the loopback-only `wealth_pillar_test` suite.
Current integration fixtures still include reduced tables: they do not certify
empty-database reconstruction from real migrations. The historical `0000` file is
a marker, not a full baseline. Do not run generic migrations on production before
catalog equivalence and journal adoption have been implemented and reviewed.

Local tests do not certify serverless networking or latency. The complete
consolidation still requires a reproducible baseline/adoption migrator, relational
association backfills and application adoption, persistent idempotency, bounded
Dashboard/list queries, aggregate-specific domain types, cache consolidation,
measured FK/index work, fault injection, synthetic benchmarks and authenticated
E2E/Preview validation. No capacity or p95 target is claimed by these changes.

References: [Postgres.js 4 tracing](https://github.com/porsager/postgres/blob/v4.0.0/README.md#tracing),
[Supabase direct connections](https://supabase.com/docs/guides/database/connecting-to-postgres).
