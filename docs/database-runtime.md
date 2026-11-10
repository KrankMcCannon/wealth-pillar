# Database runtime and release gates

Runtime accepts the existing Supabase pooler or a direct endpoint in `DATABASE_URL`;
administrative migration tools require a direct `DATABASE_ADMIN_URL`. Neither value
belongs in client bundles or logs. Remote connections require certificate-verified
TLS; loopback fixtures can use plaintext. `DIRECT_URL` is not read. Postgres.js is
pinned to 4.0.0 and Drizzle remains at the installed version.

Supabase pooler and direct database hostnames add the bundled Supabase public root
CA to Node's bundled public roots, with certificate and hostname verification.
Other remote hosts use Node's normal trust store. The Supabase root expires on
26 April 2031; review provider certificate
rotation and replace it from a verified Supabase source before expiry. Do not trust
a certificate solely because the server presented it during the same connection.

Each warm process reuses a pool with at most three connections. Direct connections
use pipeline depth eight; transaction poolers on port 6543 use depth one, a 5 s
queue timeout and no session timeout settings. Direct connections use 5 s, 2 s,
10 s, 5 s and 15 s for connection, queue, statement, lock and transaction timeouts.
Queries remain unnamed so they can run through a transaction pooler.
The transport watchdog is enabled by default (`DB_POOL_RECOVERY_ENABLED=false`
temporarily disables it): after a
20 s deadline it retires the affected pool generation once and does not replay a
write. A lost response requires an authenticated operation-outcome lookup.

`DB_TELEMETRY_ENABLED=true` enables the native Postgres.js diagnostic channels.
Events contain allowlisted timings, counts, error codes and operation correlation;
SQL, parameters, result contents, credentials and host names are excluded.
Round-trip time includes the network and is not PostgreSQL execution time. Mapping
and result-size measurements are emitted only for instrumented paths, and cache
misses include coalesced misses; these metrics do not yet cover every operation.

EUR ledger deltas and aggregate folds use decimal strings and bigint minor units.
Investment calculations use decimal.js before conversion for presentation.
Financial commands persist a payload hash and committed response in the same
transaction. IndexedDB retains pending identifiers across tabs and reloads. A
missing receipt means the outcome is unknown. Operation receipts currently have
no automatic retention limit: deleting them without coordinating client recovery
would permit duplicate effects, so monitor their size and design retention before
purging them.

Ledger and investment mutation methods require an executor explicitly. Other
financial repositories still resolve the active transaction from the request
context and do not yet all enforce an explicit executor in their type signatures.
Complete that contract before declaring the architectural migration finished.

## Deployment sequence

The migration and release procedure is in [database-consolidation-release.md](releases/database-consolidation-release.md).
The schema expansion and compatibility columns must precede the application that
uses relational reads and durable commands. The production URL and region have not
been changed by this code. Before activation, verify the Netlify plan permits `fra`,
select that Functions region, provide a direct URL in the correct environment
scope, and test TLS and network connectivity from a Preview against a separate
test database. The previously inspected direct endpoint resolved only to IPv6;
current DNS and the deployed runtime must be checked again. If IPv4 is required,
price and approve the Supabase add-on first.

The synthetic benchmark is `pnpm db:benchmark` against the isolated test DB.
It measures repository workloads, not hosted request latency. It does not by
itself certify the 1.5 s server p95 or a 30% improvement. Preview load testing,
the pre-change comparison and post-release monitoring are required before those
claims can be made.

References: [Postgres.js tracing](https://github.com/porsager/postgres/blob/v4.0.0/README.md#tracing),
[Supabase direct connections](https://supabase.com/docs/guides/database/connecting-to-postgres),
[Netlify Functions region](https://docs.netlify.com/build/functions/configuration/#region).
