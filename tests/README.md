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

Setup refuses a nonempty database. It generates tables, checks, indexes and foreign
keys from the application's Drizzle schema and seeds accounts, categories, a paginated
ledger, recurring transactions and budget periods. Supabase auth helper functions are
local stubs; these browser tests exercise application permissions, not Supabase RLS.
Tables and indexes are applied exactly as exported, so invalid defaults and
incompatible operator classes fail setup. Each run clears the local Next.js build
cache before building so cached user records cannot refer to a previous fixture.

Every browser receives an isolated context initialized from the setup session.
Mutation tests edit/delete only their own UUID-tagged transaction. Changes are checked
again after a page reload so optimistic UI alone cannot pass the test. Teardown removes
the owned local database contents and generated session files. Financial integrity and
concurrency are additionally covered by [the PostgreSQL suite](integration/README.md).

Authentication files, `.env.e2e`, Playwright reports and traces are ignored by Git.
The CI unit/integration workflow does not use these Clerk credentials. Run browser
E2E explicitly in the configured local environment.
