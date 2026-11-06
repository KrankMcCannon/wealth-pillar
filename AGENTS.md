# Wealth Pillar

Household finance for families and small groups. Use `package.json`, runner
configs and CI for versions and commands.

## Context and memory

For nontrivial project work, search the local decision cache first with
`python3 scripts/ai-harness/knowledge.py find <keywords>`. A missing cache is
normal. Read only relevant matches; `current` means the cited files are unchanged,
not that a claim was independently proved. Recheck the owning code before edits.
Current user instructions and live source take precedence over cached notes.

The user authorizes this project's local cache for verified reusable decisions,
preferences and pitfalls. Save only findings that avoid repeated investigation:
use a stable ID, a short claim and repository source files with `knowledge.py put`
(see `docs/ai-harness/README.md`). Replace the same ID when corrected; never store
speculation, secrets, financial records, transcripts or production state. Do not
copy generic instructions or passing test reports into the cache. Native Codex
memory updates follow the runtime's explicit-request and note-file rules.

## Engineering safeguards

Apply these to implementation and review even when no optional skill is invoked.
Before a material change, read the affected sections of
`docs/ai-harness/engineering.md`: trace the origin and callers, inspect sibling
implementations, find existing helpers/libraries, and choose the owning layer.
Reuse before adding code. Prefer an existing solution, standard library, native
platform feature or installed dependency before creating a new abstraction.

Keep dependencies acyclic. Before adding an import, injected dependency or
re-export, trace its transitive path back to the caller, including barrel files.
Move shared behavior to an appropriate lower-level module when needed; do not
hide a cycle with dynamic imports, lazy injection or duplicate implementations.
Preserve server/client boundaries. Follow existing patterns and error/result
contracts; apply SOLID/DRY to concrete responsibilities and duplication, without
forcing classes, factories or one-use wrappers into functional code.

Review the final diff for root-cause fixes, sibling parity, changed state/error
paths, money/permissions, bounded queries, retry behavior, duplication and dead
code. Verify affected callers and meaningful regressions. Do not treat successful
typecheck/lint as proof that dependency cycles or architectural errors are absent.

## Ownership and contracts

Routes: `app/[locale]/`; feature UI/actions: `src/features/`; business logic:
`src/server/use-cases/`; data access: `src/server/repositories/`; schema:
`src/server/db/`; shared UI: `src/components/`. Keep Server Actions thin and
preserve server/client boundaries. Before changing a Next.js API, read the
relevant installed documentation in `node_modules/next/dist/docs/`.

For persistence or authorization, read `src/server/db/ACCESS_CONTROL.md` and
verify user/group checks at the owning layer. Establish money, currency,
precision and calendar semantics from domain code and tests, not UI labels.
Reuse `FinancialResourcePolicy`, the ledger classifier, money helpers and
`financial-date.ts`; do not create parallel financial calculations. The accounting
day is Europe/Rome; timestamps remain instants. UI-only currency changes preserve
EUR inputs/payloads for transactions, recurring series and budgets, and stored
account balances. Investment FX follows its separate contract in `docs/currencies.md`.

Backend DB roles bypass RLS: verify server-side ownership, group membership and
referenced resources, including transfer destinations. An admin belongs to a
group; their role does not grant access to another group. Preserve transaction
atomicity, idempotency and server-authoritative balance reconciliation when touched.
Before migrations, inspect the journal and installed objects; old memory about
PR #58 is historical evidence, not a current database diagnosis or application plan.

For UI/copy work, read relevant sections of `PRODUCT.md`, `DESIGN.md`,
`STRUCTURE.md` and related `IMPROVEMENTS.md` entries. Reuse tokens, components
and accessibility patterns; update Italian and English messages together.

## Verification

- Static checks: `pnpm run typecheck`, `pnpm run lint`.
- Financial calendar checks: `node scripts/check-financial-dates.mjs`.
- Targeted unit tests: `pnpm exec vitest run <test-file>`.
- Integration: read `tests/integration/README.md` and use an explicitly isolated
  DB with `pnpm run test:integration -- <test-file>`.
- E2E: read `tests/README.md` and `playwright.config.ts` for application,
  browser and Clerk prerequisites; `pnpm run test:e2e -- <spec>`.

Run checks that prove the change. Documentation alone needs no product tests.
Do not repeat successful checks unless relevant inputs change. Never run
integration/E2E against production. CI's `Quality` check remains the merge gate.
`pnpm run harness:eval` is an explicit full local check; it does not run a build,
integration or E2E. See `docs/ai-harness/README.md` only for harness changes/setup.

Use one primary workflow suited to the task: `bug-flow`, `feature-flow`,
`refactor-flow`, `review-pr`, or `wealth-pillar-flow` for a domain trace spanning
multiple layers. General workflows read the project engineering and financial
references directly; do not invoke another workflow just to obtain those rules.
Ponytail, simplification, cleanup, test generation and architecture comparison
remain available for their specific tasks. General tooling/setup uses its own
applicable skill. AWS,
Cloudflare, BizAway, Mongo, Jira/Confluence and Obsidian procedures do not describe
this project. Connected tools are capabilities, not evidence of the deployed stack.

Do not commit, push, merge, deploy or send messages without task authorization.
