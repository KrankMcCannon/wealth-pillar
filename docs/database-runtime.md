# Database runtime: Postgres.js 4.0

`postgres` is pinned to **4.0.0** (the JavaScript driver, not the PostgreSQL
server). Drizzle uses the shared `createPostgresClient` factory; the budget
snapshot backfill uses the same defaults. No driver internals are patched.

## SQL compatibility

Keep server-side parameter inference (`infer: false`) and unnamed statements
(`prepare: false`). Drizzle serializes column values; raw SQL must provide casts
where PostgreSQL cannot determine the parameter type. UUID identifiers, numeric
balance deltas, RPC arguments and advisory-lock inputs have explicit SQL types.
UUID overlap uses Drizzle's `arrayOverlaps` column encoder instead of interpolating
a JavaScript array as a SQL list. Empty budget snapshots remain JSON arrays.
Financial dates remain strings and decimal amounts remain exact database decimals.

## Bounded waits

Each server instance has at most three connections. Connection establishment and
pool queue waits are limited to five seconds; idle connections close after twenty
seconds and connections recycle after five minutes. `max_pipeline: 1` limits
concurrent exchanges but is **not** a workaround for every Supavisor protocol bug.

For direct PostgreSQL or session pooling, connection defaults set UTC,
`statement_timeout = 10000`, `lock_timeout = 5000` and
`idle_in_transaction_session_timeout = 15000` (milliseconds). These are statement
and lock limits, not a total transaction deadline. Caller overrides are supported
for isolated tests and maintenance jobs with deliberately different requirements.

Supabase transaction pooling on port 6543 does not support session settings.
The factory omits these GUCs on that port; it cannot promise server cancellation
there. Custom transaction-pooler endpoints must likewise supply appropriate
server/role settings. Configure defaults for the dedicated runtime role through
an administrative connection, then recycle the pooler's backend connections and
verify the effective settings. A reviewed deployment change could use:

```sql
ALTER ROLE pool_user SET statement_timeout = '10s';
ALTER ROLE pool_user SET lock_timeout = '5s';
ALTER ROLE pool_user SET idle_in_transaction_session_timeout = '15s';
ALTER ROLE pool_user SET timezone = 'UTC';
```

These statements are **not automatically applied by the application or this PR**.
Check the effective settings through the actual runtime connection with
`SHOW statement_timeout`, `SHOW lock_timeout`, and
`SHOW idle_in_transaction_session_timeout`; never infer them from client options.

Forms separately release loading state on error or timeout and preserve drafts.
A UI deadline does not undo a write that already reached the server. No automatic
mutation retries are introduced; after an uncertain result the message asks the
user to check whether the entity was saved before submitting again.

## Hosted pooler incident and deployment verification

A timeout tagged `PARSE` with the backend waiting on `ClientRead`, rather than a
lock, is consistent with a stalled protocol exchange. Supabase issue
[#50358](https://github.com/supabase/supabase/issues/50358) reports this signature
with Postgres.js 3.x too. This is evidence of a possible pooler fault, not proof
that the affected hosted instance has a particular Supavisor version.

If it persists, verify the Supavisor fixes with the provider or use the **session
pooler** connection string supplied by the Supabase dashboard for `DATABASE_URL`.
Do not construct a new endpoint by blindly replacing its port. Session pooling
holds backend connections longer: account for three connections per warm
application instance and the project's connection budget before switching.

No production connection string is changed here. Before deploying, verify the
chosen endpoint, role timeouts, concurrent page loads and a transaction save in
an isolated preview. Local tests use direct PostgreSQL and cannot reproduce or
certify the hosted pooler transport. Authentication-dependent browser flows must
also be checked with a test Clerk account.

References: [Postgres.js 4.0](https://github.com/porsager/postgres/blob/v4.0.0/README.md),
[Supabase timeouts](https://supabase.com/docs/guides/database/postgres/timeouts).
