# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Features

- **agent**: Added workflows for project structure, UX/UI, optimization, git, logic extraction, components, typescript, and tailwind consistency.
- **accounts**: Extracted logic from `AccountsContent` to `useAccountsContent` hook.
- **transactions**: Extracted business logic from `TransactionsContent` to `useTransactionsContent` hook.
- **transactions**: Added named `LoadMoreTransactionsResult` interface for better type safety.
- **budgets**: Extracted business logic from `BudgetsContent` to `useBudgetsContent` hook (~59% reduction).

### Performance

- **accounts**: Optimized `filteredBalances` and `accountStats` calculations in `useAccountsContent`.
- **transactions**: Optimized daily totals calculation by reusing `TransactionLogic.calculateDailyTotals` (DRY principle).

### Refactor

- **dashboard**: Extracted business logic from `DashboardContent` to `useDashboardContent` hook (~36% reduction).
- **dashboard**: Replaced hardcoded colors (`bg-green-500`, `bg-yellow-500`, `bg-red-500`) with semantic tokens (`bg-success`, `bg-warning`, `bg-destructive`).
- **settings**: Extracted components, logic to `useSettings` hook, and centralized styles.
- **transactions**: Reduced `TransactionsContent` component from ~430 to ~207 lines by extracting logic to hook.
- **recurring**: Replaced raw color tokens (`emerald-500`, `red-500`) with semantic tokens (`success`, `destructive`).
- **recurring**: Centralized hardcoded classes in `pause-series-modal` and `recurring-series-section` to style objects.
- **budgets**: Replaced hardcoded hex colors in `BudgetChart` with semantic tokens (`gridLineColor`, `lineStroke`, `dotFill`).
- **budgets**: Replaced `text-emerald-600` with `text-success` in `budget-section`.

- **investments**: Extracted logic to `useShareSearch` and `useInvestmentHistory`, split `PersonalInvestmentTab` into smaller components, and centralized styles in `investments-styles.ts`.
- **reports**: Extracted logic to `useReportsData` and `useBudgetPeriods` hooks, extracted components, and centralized styles in `reportsStyles`.

### Bug Fixes

- **settings**: Fixed group users fetching and role capitalization.
- **build**: Fixed missing "use client" directive in `settings-content.tsx`.
- **budgets**: Fixed division by zero in chart data generation when period has only 1 day.

### Documentation

- **project**: Updated `PROJECT_STRUCTURE.md` with comprehensive architecture documentation.
