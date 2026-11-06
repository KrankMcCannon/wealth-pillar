# Wealth Pillar: financial boundaries

These are discovery pointers. Read the affected implementation and tests before
editing; do not load every listed file for an unrelated change.

| Boundary                         | Owning evidence                                                                                                                           | What must be preserved when touched                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Spendable, reserve and transfers | `src/server/ledger/`, `src/lib/utils/account-classification.ts`                                                                           | Shared classifier; transfer effects on both accounts and spendable/reserve; distinguish balance stock from report-window flow.                                                                                         |
| Amounts                          | `src/lib/utils/money.ts`, `money-coerce.ts` in the same directory                                                                         | Existing cents/rounding and DB numeric conversion; no ad hoc float arithmetic or storage-unit migration in a UI change.                                                                                                |
| Currency                         | `docs/currencies.md`, `src/providers/currency-provider.tsx`, `src/components/form/modal-fields/modal-amount-field.tsx`                    | EUR source inputs and payloads for transactions/recurrences/budgets; account display conversion; historical investment FX is separate. Never invent 1:1 fallback rates.                                                |
| Calendar and recurrence          | `src/lib/utils/financial-date.ts`, `src/lib/recurring/`, `src/server/use-cases/budget-periods/`                                           | Rome accounting days, instant timestamps, period boundaries and frequency semantics; run the financial-date check for affected dates.                                                                                  |
| Authentication and groups        | `src/server/db/ACCESS_CONTROL.md`, `src/lib/permissions/action-auth.ts`, `src/server/permissions/financial-resource-policy.ts`            | Server-only DB access, caller identity, same-group resources and ownership, including transfer destination and referenced categories/users/accounts. Clerk organizations are not the household-group permission model. |
| Mutation reconciliation          | `src/lib/server-action/run-authorized-mutation.ts`, `src/stores/balance-reconciliation.ts`, affected feature stores                       | Atomic mutation, authoritative balances/revisions, optimistic rollback and retry/idempotency behavior.                                                                                                                 |
| Portfolio history                | `src/server/use-cases/investments/persist-portfolio-snapshots.use-case.ts`, `investment.portfolio.snapshot.test.ts` in the same directory | Complete dated snapshots, retained valid quotes and idempotency; missing provider data must not silently become zero or a partial overwrite.                                                                           |

For DB changes inspect Drizzle schema/migrations and the actual target journal
before choosing an application command. Prepare and verify locally; this workflow
does not authorize production DDL. The PR #58 runbook is specific to its preflight
conditions and must not be reused as a universal migration command.

Use nearby unit tests for local logic and `tests/integration/README.md` for atomicity,
concurrency and cross-group persistence checks. Run UI persistence journeys only
with the environment described in `tests/README.md` and `playwright.config.ts`.
