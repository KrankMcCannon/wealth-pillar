# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Features

- **agent**: Added workflows for project structure, UX/UI, optimization, git, logic extraction, components, typescript, and tailwind consistency.
- **accounts**: Extracted logic from `AccountsContent` to `useAccountsContent` hook.
- **transactions**: Extracted business logic from `TransactionsContent` to `useTransactionsContent` hook.
- **transactions**: Added named `LoadMoreTransactionsResult` interface for better type safety.

### Performance

- **accounts**: Optimized `filteredBalances` and `accountStats` calculations in `useAccountsContent`.
- **transactions**: Optimized daily totals calculation by reusing `TransactionLogic.calculateDailyTotals` (DRY principle).

### Refactor

- **settings**: Extracted components, logic to `useSettings` hook, and centralized styles.
- **transactions**: Reduced `TransactionsContent` component from ~430 to ~207 lines by extracting logic to hook.
- **recurring**: Replaced raw color tokens (`emerald-500`, `red-500`) with semantic tokens (`success`, `destructive`).
- **recurring**: Centralized hardcoded classes in `pause-series-modal` and `recurring-series-section` to style objects.

### Bug Fixes

- **settings**: Fixed group users fetching and role capitalization.
- **build**: Fixed missing "use client" directive in `settings-content.tsx`.

### Documentation

- **project**: Generated `PROJECT_STRUCTURE.md`.
