# Code review follow-up: database, E2E, and financial pages

Date: 2026-11-11

Base: `c3dd4733ba8eda2df5e0dcd304a070c1f93f6f39`

Scope: local source and isolated local checks only. No hosted database, production
data, deployment, or credentials were accessed.

Local runtime: macOS 27.2 arm64, Node.js 22.13.0, Next.js 16.4.3,
Vitest 4.1.12. PostgreSQL was unavailable on the checked local endpoints.

## Changes

- Category creation and update now receive the owning `DbExecutor`; creation's
  uniqueness lookup and insert share one `financialTransaction`. Category cache
  invalidation remains after commit.
- Bank connection revocation now uses `financialTransaction` and its explicit
  executor.
- Added a static contract test that rejects implicit `resolveDb()` writes in
  financial repositories and use cases. The explicit allowlist is limited to
  administrative/reference repositories for groups, users, preferences, orphan
  users, invitations, available shares, and market data.
- Added PostgreSQL rollback coverage for category creation. This test was not
  executable because the isolated local PostgreSQL service was unavailable.
- Extended the synthetic benchmark output with p99, application pool connection
  and waiting high-water marks, pool retirements, and receipt/transaction
  reconciliation. Removed a local p95 pass threshold: local client-observed
  latency is not the hosted server-side p95 objective.
- Added `pnpm db:check-ca` and a weekly workflow. The check reports the bundled
  CA validity and warns within 180 days; the release procedure documents the
  verified-source rotation review and TLS verification requirements.

## Checks and observations

- TypeScript typecheck: passed using the installed TypeScript executable.
- ESLint: passed using the installed ESLint executable.
- Unit suite: 209 files, 1,197 tests passed.
- Financial calendar: 97 checks passed each in UTC, Europe/Rome, and
  America/Los_Angeles.
- Financial write contract test: passed as part of the full unit suite.
- CA bundle check: passed. Subject `Supabase Root 2021 CA`, fingerprint
  `80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA`,
  expiry `2031-04-26T10:56:53Z`, 1,626 days remaining at check time. This checks
  the bundled certificate only; the current hosted Supabase chain was not
  independently checked.
- `git diff --check`: passed.
- The `pnpm` wrapper could not fetch its pinned package-manager version in this
  environment. Equivalent installed Node executables were used for the checks
  above.

## Not verified

- PostgreSQL integration/rollback tests and `db:benchmark` were not run. Neither
  `127.0.0.1:55439` nor `127.0.0.1:5432` had a responding PostgreSQL service; the
  documented isolated cluster path was absent. No database was initialized or
  provisioned.
- The Preview workload was not run because no reachable, already-authorized
  isolated Preview target was available. There are no Preview latency, capacity,
  connection, timeout, retirement, or reconciliation measurements in this
  report. Baseline equivalence and the 30% improvement are therefore unassessed.
- The authenticated E2E suite and Chromium, Firefox, WebKit, Mobile Chrome, and
  Mobile Safari matrix were not run. E2E requires the dedicated PostgreSQL
  database and configured Clerk development session. Consequently, worker data
  isolation and three consecutive no-retry matrix passes remain unverified.
- Production build did not complete. Turbopack failed when the sandbox denied
  its worker coordination process/port; the approved elevated retry failed the
  same way. A local Webpack retry reached compilation but failed in the existing
  Tailwind/`magic-string` ESM loading path. This is not evidence of a successful
  build.
- Dashboard, reports (including historical-period detail), and investments were
  reviewed statically at their page/use-case boundaries. Dashboard and report
  data are group-scoped before role-based response scoping; historical period
  detail verifies both period and owner group; investment user selection is
  constrained to the authorized group and non-admin user. Unit tests cover
  aggregation, report windows, snapshot completeness, and portfolio logic. No
  persisted-data reconciliation or browser navigation/performance conclusion
  can be made without the isolated database and browser run.
- `docs/ai-harness/engineering.md`, referenced by the requested skill, is absent
  in this checkout. The available `AGENTS.md`, `wealth-pillar-flow` skill, and
  `src/server/db/ACCESS_CONTROL.md` were followed.

The pre-existing `.env.example` edit was preserved. No commit was created.
