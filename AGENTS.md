# Wealth Pillar

Household finance for families and small groups. Use `package.json`, runner
configs and CI for versions and commands.

## Ownership and contracts

Routes: `app/[locale]/`; feature UI/actions: `src/features/`; business logic:
`src/server/use-cases/`; data access: `src/server/repositories/`; schema:
`src/server/db/`; shared UI: `src/components/`. Keep Server Actions thin and
preserve server/client boundaries. Before changing a Next.js API, read the
relevant installed documentation in `node_modules/next/dist/docs/`.

For persistence or authorization, read `src/server/db/ACCESS_CONTROL.md` and
verify user/group checks at the owning layer. Establish money, currency,
precision and calendar semantics from domain code and tests, not UI labels.

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

Do not commit, push, merge, deploy or send messages without task authorization.
