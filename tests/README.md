# Browser E2E tests

The browser suite uses a **real Clerk development session** and a disposable,
loopback-only PostgreSQL database named `wealth_pillar_e2e`. Fake cookies do not
bypass Clerk's server-side middleware. There are no conditional assertions or
silent skips when required controls/data are absent.

Create an empty local database named `wealth_pillar_e2e`. In an ignored `.env.e2e`
file, configure these variables (keep the values out of Git):

- `DATABASE_URL`: loopback connection to `wealth_pillar_e2e`.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: development publishable key (`pk_test_`).
- `CLERK_SECRET_KEY`: development backend key (`sk_test_`).
- `E2E_USER_EMAIL`: an existing, dedicated user in that same Clerk instance.

No paid Clerk production instance is needed. The email sign-in helper creates a
test session using a backend sign-in ticket; it does not send an email or require
a password. The setup never creates/deletes Clerk users or changes their profiles.
Use a test user with no sign-in task/MFA requirements.

```sh
pnpm exec playwright install chromium
pnpm exec playwright test --project chromium --workers 1
```

Setup refuses a nonempty database. It constructs the production-shaped schema using the active SQL migrations and seeds accounts, categories, a paginated
ledger, recurring transactions and budget periods. Supabase auth helper functions are
local stubs; these browser tests exercise application permissions, not Supabase RLS.
The actual migration SQL, constraints, indexes and triggers are applied, so incompatible schema changes fail setup. Each run clears the local Next.js build
cache before building so cached user records cannot refer to a previous fixture.

Every browser receives an isolated context initialized from the setup session.
Mutation tests edit/delete only their own UUID-tagged transaction. Changes are checked
again after a page reload so optimistic UI alone cannot pass the test. Teardown removes
the owned local database contents and generated session files. Financial integrity and
concurrency are additionally covered by [the PostgreSQL suite](integration/README.md).

Authentication files, `.env.e2e`, Playwright reports and traces are ignored by Git.
The CI unit/integration workflow does not use these Clerk credentials. Run browser
E2E explicitly in the configured local environment.

## Required CI smoke

`pnpm run test:e2e:smoke` uses the existing real Clerk setup and local PostgreSQL
fixtures, runs Chromium with one worker, then tears down the fixture. It covers
persistent navigation, creating a transaction, editing/deleting a transaction,
and the notification settings panel. Creation and edits are checked immediately
and after reload. The full browser matrix remains a separate command.

The CI `E2E smoke (Chromium)` job is required by `Quality`. A failed, cancelled,
missing or skipped smoke job fails that gate. Configure repository secrets
`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `E2E_USER_EMAIL` using a
Clerk development instance and a dedicated existing test user. No production
`DATABASE_URL` secret is used: the job provisions PostgreSQL 17 locally and the
existing guard requires the database `wealth_pillar_e2e` on loopback.

The preflight fails explicitly if development credentials are missing; no passing
fallback or fake Clerk session is used. Secrets are not available to untrusted
fork PRs, so their smoke gate requires a reviewed branch in the repository.
Do not use `pull_request_target` to execute untrusted code with those credentials.
No session files or traces containing authentication data are uploaded by the job.
