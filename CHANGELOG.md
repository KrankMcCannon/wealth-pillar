# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Chore

- **agent**: Improve workflow instructions and add turbo annotations for safer and faster execution.

## [0.5.0] - 2026-01-28

### Refactor

- **budget-summary**: Fixed user selection infinite loop, extracted components (`BudgetSummaryCards`, `BudgetSummaryActiveList`), and centralized styles.
- **theme**: Implemented default dark mode using `next-themes` and fixed hydration mismatch.
- **core**: Added `useMounted` hook for SSR-safe client components.

### Fix

- **budget-summary**: Resolved infinite loop when switching users by decoupling URL and store state.

### Features

- **agent**: Added workflows for project structure, UX/UI, optimization, git, logic extraction, components, typescript, and tailwind consistency.

### Refactor

- **reports**: Extracted logic to `useReportsData` and `useBudgetPeriods` hooks, extracted components, and centralized styles.
- **investments**: Extracted logic to `useShareSearch` and `useInvestmentHistory`, split `PersonalInvestmentTab`, and centralized styles.
- **dashboard**: Extracted business logic to `useDashboardContent` hook and replaced hardcoded colors with semantic tokens.
- **budgets**: Extracted business logic to `useBudgetsContent` hook and fixed style violations.
- **transactions**: Extracted business logic to `useTransactionsContent` hook, added `LoadMoreTransactionsResult` interface, and consolidated styles.
- **settings**: Extracted components and logic to `useSettings` hook, and centralized styles.
- **accounts**: Extracted logic to `useAccountsContent` hook and optimized calculations.
- **recurring**: Replaced raw color tokens with semantic tokens and centralized styles.

### Performance

- **accounts**: Optimized `filteredBalances` and `accountStats` calculations.
- **transactions**: Optimized daily totals calculation (DRY).

### Bug Fixes

- **settings**: Fixed group users fetching and role capitalization.
- **build**: Fixed missing "use client" directive in `settings-content.tsx`.

## [0.4.0] - 2026-01-27

### Features

- **budgets**: Added budget summary page.

### Bug Fixes

- **reports**: Fixed budget periods calculation and category expense list.
- **budgets**: Fixed bug when closing and opening a new budget period.
- **budgets**: Fixed division by zero in chart data generation.

### Refactor

- **investments**: Removed historical portfolio data fetching and refined component types.

## [0.3.0] - 2026-01-25

### Features

- **investments**: Implemented investment section and logic.
- **investments**: Added investment taxes.
- **investments**: Added market cache table.

### Bug Fixes

- **investments**: Fixed current value calculation.
- **investments**: Fixed personal investment calculation and style.

### Performance

- **services**: Improved services performance and removed unused functions.

### Scripts

- **cron**: Inserted script in cron job.

## [0.2.0] - 2026-01-16

### Refactor

- **auth**: Restructured authentication pages to dedicated Clerk routes.
- **server**: Encapsulated Prisma client initialization.
- **utils**: Consolidated permissions utilities and cache modules.
- **server**: Implemented data serialization for server action responses.

### Bug Fixes

- **auth**: Fixed sign-in wrong redirections.
- **types**: Added explicit type annotations in useState callbacks.

## [0.1.0] - 2026-01-12

### Style

- **ui**: Implemented dark-mode.
- **ui**: Improved modal styles and interactions.
- **ui**: Centralized components and project style refactor.
