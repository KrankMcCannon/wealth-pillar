# Changelog

All notable changes to this project will be documented in this file.

## [0.7.1] - 2026-02-06

### Fixed

- **i18n**: Fixed broken redirects by appending locale prefix to ensure language persistence.
- **i18n**: Replaced raw `next/navigation` imports with type-safe localized wrappers to support routing configuration.
- **i18n**: Improved request locale validation and type safety in `request.ts`.

## [0.7.0] - 2026-02-06

### Added

- **i18n**: Internationalization support using `next-intl` with English and Italian locales.
- **settings**: Language preference customization in user profile.
- **ui**: Localized date and currency formatting across the application.

## [0.6.1] - 2026-02-04

### Test

- **e2e**: Added comprehensive E2E tests for transaction visualization, creation, update, and deletion.
- **e2e**: Implemented client-side mock for Clerk authentication to enable testing without external dependencies.
- **e2e**: Configured E2E code coverage using `monocart-reporter` and V8 coverage.
- **e2e**: Enabled and verified mobile E2E tests for Chrome (Pixel 5) and Safari (iPhone 12).

### Docs

- **project**: Rewrote `PROJECT_STRUCTURE.md` as comprehensive agent-optimized reference (828 lines) with architecture diagrams, data flows, services, stores, user flows, styling system, and coding patterns.
- **project**: Refactored `README.md` to align with GitHub standards and current tech stack (Next.js 16, React 19, Zustand 5), and added a professional product overview section.
- **workflows**: Updated `describe-project-structure` workflow to support incremental updates with clear triggers and section mapping.

## [0.6.0] - 2026-02-03

### Features

- **auth**: Implemented Google One Tap for seamless sign-in.
- **categories**: Implemented strict isolation between System (Nil UUID) and Custom categories (`group_id`).

### Refactor

- **auth**: Modernized complete auth flow using Server Components and removing legacy wrappers.
- **auth**: Standardized Clerk redirections using `forceRedirectUrl`.
- **cleanup**: Removed unused `social-buttons` and `user-button` components.

### Fix

- **auth**: Resolved "User not found" crash by gracefully handling missing DB records in `UserService`.
- **budgets**: Fixed hydration error caused by nested buttons in `BudgetPeriodManager`.
- **onboarding**: Fixed empty category list by serving system defaults when no group exists.

## [0.5.6] - 2026-02-03

### Test

- **infra**: Setup Playwright for E2E testing and Vitest for unit testing with corresponding dependencies.

### Chore

- **workflows**: Reorganize agent workflows and update project configuration.

## [0.5.5] - 2026-02-01

### Refactor

- **reports**: Architecturally decouple data fetching from presentation, consolidate components in feature directory, and restore static all-time view default.

## [0.5.4] - 2026-02-01

### Refactor

- **reports**: Revert strict metric separation and restore payroll-only filtering logic significantly simplifying the implementation.

## [0.5.3] - 2026-01-30

### Refactor

- **project**: Applied comprehensive linting fixes, TypeScript best practices, and performance optimizations across the entire codebase.
- **components**: Refactored logic in `swipeable-card`, `dashboard`, and modals to reduce complexity and improve maintainability.
- **services**: Optimized server-side logic in finance and page data services.
- **utils**: Centralized validation and caching utilities.

## [0.5.2] - 2026-01-29

### Refactor

- **auth**: Created `AuthPageWrapper` component to eliminate duplication in sign-in/sign-up pages.
- **auth**: Replaced `bg-white` with `bg-card` in Clerk appearance for dark mode support.
- **investments**: Added proper exports for hooks and theme in feature index.

### Style

- **investments**: Replaced raw colors (`emerald-600`/`rose-600`) with semantic tokens (`text-success`/`text-destructive`).
- **ui**: Fixed `bg-white` → `bg-card` in not-found page for dark mode compatibility.

## [0.5.1] - 2026-01-29

### Chore

- **agent**: Update git commit workflow to remove Unreleased section and enforce immediate versioning.
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
