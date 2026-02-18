# Codebase Concerns

**Analysis Date:** 2026-02-18

## Technical Debt

**Stripe & Email Integration:**
- **Issue**: Multiple TODOs for Stripe checkout, subscription management, and email notifications (Resend/SendGrid) are present but not implemented.
- **Files**: `src/features/settings/actions.ts`, `src/features/settings/components/subscription-modal.tsx`
- **Impact**: Subscription features and user notifications are non-functional placeholders.
- **Fix approach**: Implement Stripe SDK integration and a mail service provider.

**Clerk Webhook Sync:**
- **Issue**: `user.created` webhook is a stub; user creation is deferred to the onboarding flow.
- **Files**: `src/lib/webhooks/clerk-webhook-handler.ts`, `app/api/webhooks/clerk/route.ts`
- **Impact**: Potential for orphaned Clerk users if onboarding is not completed; inconsistency between Clerk and Supabase.
- **Fix approach**: Ensure robust cleanup or pre-creation of user records with nullable group associations if possible.

**Centralized Style Registry:**
- **Issue**: `src/styles/system.ts` is exceptionally large (>1500 lines) and manually maintains Tailwind strings.
- **Files**: `src/styles/system.ts`
- **Impact**: High maintenance burden, potential for unused styles being kept in the registry, and reduced discoverability compared to standard Tailwind usage.
- **Fix approach**: Break into smaller style modules or migrate back to standard Tailwind utility usage where centralization doesn't add value.

## Performance Bottlenecks

**Finance Logic Complexity:**
- **Problem**: Many core financial calculations (metrics, filtering, breakdowns) are performed in-memory with O(n) or O(n + m log m) complexity.
- **Files**: `src/server/services/finance-logic.service.ts`
- **Cause**: Processing large arrays of transactions on the server or client instead of using database aggregations.
- **Improvement path**: Shift heavy aggregations (e.g., total spent per category) to SQL/Supabase queries.

**Large Component/Hook Logic:**
- **Problem**: Components and hooks like `useBudgetsContent` and `transaction-filters` are very large and handle complex state/logic.
- **Files**: `src/features/budgets/hooks/useBudgetsContent.ts` (476 lines), `src/features/transactions/components/transaction-filters.tsx` (822 lines)
- **Cause**: Tight coupling of UI logic and data processing.
- **Improvement path**: Extract sub-hooks and helper functions into separate utility files.

## Test Coverage Gaps

**Service Layer Testing:**
- **What's not tested**: Most services in `src/server/services/` (Account, Budget, Category, Investment, Recurring, etc.) lack dedicated unit tests.
- **Files**: `src/server/services/*.ts`
- **Risk**: Regressions in core business logic and database interactions may go unnoticed.
- **Priority**: High

## Fragile Areas

**Recurring Series Actions:**
- **Files**: `src/features/recurring/actions/recurring-actions.ts`
- **Why fragile**: Contains manual permission checks and complex validation logic with multiple "return null" stubs or simple error strings.
- **Safe modification**: Ensure all edge cases for "due_day" and "frequency" are covered by unit tests before refactoring.
