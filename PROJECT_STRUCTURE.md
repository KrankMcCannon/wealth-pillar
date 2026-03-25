# PROJECT_STRUCTURE.md - Agent Reference Guide

> **Purpose**: This document provides AI agents with complete codebase context for the Wealth Pillar application. All information is structured for rapid agent comprehension and accurate code generation.

---

## Quick Reference

| Property       | Value                                            |
| -------------- | ------------------------------------------------ |
| **Framework**  | Next.js 16.1.1 (App Router, RSC, Server Actions) |
| **React**      | 19.2.3                                           |
| **Node**       | >=22.13.0 (enforced in package.json)             |
| **TypeScript** | Strict mode, `tsc --noEmit`                      |
| **Database**   | Supabase (PostgreSQL)                            |
| **Auth**       | Clerk (`@clerk/nextjs@^6.36.5`)                  |
| **State**      | Zustand 5.0.9 (client), RSC (server)             |
| **Styling**    | Tailwind CSS v4.1.18, OKLCH color space          |
| **Forms**      | React Hook Form 7.69 + Zod 4.2.1                 |
| **Testing**    | Playwright 1.58.1 (E2E), Vitest 4.0.18 (Unit)    |
| **UI Library** | Custom Shadcn/UI + Radix primitives              |

---

## Architecture Pattern

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Next.js App Router                          │
│                    /app (Routes, Layouts, Pages)                    │
└────────────────────────────┬────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐   ┌────────────────┐   ┌───────────────┐
│ Server        │   │ Client         │   │ Features      │
│ Components    │   │ Components     │   │ (Domain)      │
│ (Data Fetch)  │   │ (Interactivity)│   │               │
└───────┬───────┘   └────────┬───────┘   └───────┬───────┘
        │                    │                   │
        ▼                    ▼                   ▼
┌───────────────────────────────────────────────────────────┐
│              /src/features/{domain}/actions               │
│                   (Server Actions)                        │
└────────────────────────────┬──────────────────────────────┘
                             │
                             ▼
┌───────────────────────────────────────────────────────────┐
│                  /src/server/services                     │
│           (Business Logic + Database Access)              │
└────────────────────────────┬──────────────────────────────┘
                             │
                             ▼
┌───────────────────────────────────────────────────────────┐
│                  Supabase (PostgreSQL)                    │
└───────────────────────────────────────────────────────────┘
```

### Data Flow Rules

1. **Server Components** in `/app` fetch data via services → pass as props to client components
2. **Client Components** use hooks for interactivity, call server actions for mutations
3. **Server Actions** in `/src/features/{domain}/actions` wrap service methods
4. **Services** in `/src/server/services` handle all database operations
5. **Stores** (Zustand) provide client-side cache and optimistic updates

---

## Directory Structure

```
wealth-pillar/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth route group (public)
│   │   ├── sign-in/         # Clerk sign-in page
│   │   ├── sign-up/         # Clerk sign-up page
│   │   └── auth/            # SSO callback handler
│   ├── (dashboard)/         # Dashboard route group (protected)
│   │   ├── accounts/        # Bank accounts page
│   │   ├── budgets/         # Budget management page
│   │   ├── dashboard/       # Main dashboard page
│   │   ├── investments/     # Investment portfolio page
│   │   ├── reports/         # Financial reports page
│   │   ├── settings/        # User/group settings page
│   │   ├── transactions/    # Transaction list page
│   │   ├── layout.tsx       # Dashboard layout wrapper
│   │   └── loading.tsx      # Dashboard loading state
│   ├── api/                 # API routes
│   │   └── webhooks/        # Clerk webhook handlers
│   ├── globals.css          # Design tokens + utilities
│   ├── layout.tsx           # Root layout
│   └── not-found.tsx        # 404 page
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── cards/           # Card variants (StatCard, SeriesCard)
│   │   ├── form/            # Form components (FormField, FormSelect)
│   │   ├── investments/     # Investment-specific components
│   │   ├── layout/          # Layout components (Header, BottomNav)
│   │   ├── shared/          # Shared utilities (EmptyState, Dialog)
│   │   └── ui/              # Base UI (Button, Input, Modal, Tabs)
│   │       ├── fields/      # Field components
│   │       ├── interactions/# Touch/gesture components
│   │       ├── layout/      # Layout utilities
│   │       ├── primitives/  # Low-level primitives
│   │       └── theme/       # Theme components
│   ├── features/            # Domain-specific modules
│   │   ├── accounts/        # Account management
│   │   ├── auth/            # Authentication logic
│   │   ├── budgets/         # Budget tracking
│   │   ├── categories/      # Transaction categories
│   │   ├── dashboard/       # Dashboard widgets
│   │   ├── investments/     # Portfolio management
│   │   ├── onboarding/      # Onboarding flow
│   │   ├── permissions/     # RBAC system
│   │   ├── recurring/       # Recurring transactions
│   │   ├── reports/         # Financial reporting
│   │   ├── settings/        # Settings pages
│   │   └── transactions/    # Transaction CRUD
│   ├── hooks/               # Global React hooks
│   │   ├── data/            # Data fetching hooks
│   │   └── state/           # State management hooks
│   ├── lib/                 # Utilities and types
│   │   ├── auth/            # Auth utilities
│   │   ├── cache/           # Cache keys and config
│   │   ├── navigation/      # URL state (nuqs)
│   │   ├── types/           # TypeScript interfaces
│   │   ├── utils/           # Helper functions
│   │   ├── webhooks/        # Webhook handlers
│   │   └── zod/             # Zod schemas
│   ├── providers/           # React Context providers
│   ├── server/              # Server-side code
│   │   ├── db/              # Supabase client
│   │   └── services/        # Business logic services
│   ├── stores/              # Zustand stores
│   └── styles/              # Shared style objects
├── tests/                   # E2E tests (Playwright)
├── scripts/                 # Utility scripts
├── migrations/              # Supabase migrations
└── .agent/                  # Agent configuration
    └── workflows/           # Agent workflows
```

---

## Feature Module Pattern

Each feature in `/src/features/{domain}/` follows this structure:

```
/features/{domain}/
├── actions/              # Server Actions (mutations)
│   ├── index.ts         # Barrel export
│   └── {name}-actions.ts
├── components/           # Feature-specific UI
│   ├── {Name}Modal.tsx
│   ├── {Name}List.tsx
│   └── {Name}Card.tsx
├── constants/            # Feature constants
├── hooks/                # Feature hooks
│   └── use-{name}.ts
├── theme/                # Style objects
│   └── {name}-styles.ts
└── index.ts              # Public API barrel
```

### Feature List

| Feature        | Purpose                               | Key Files                               |
| -------------- | ------------------------------------- | --------------------------------------- |
| `accounts`     | Bank account CRUD, balance tracking   | `account-actions.ts`, `AccountCard.tsx` |
| `auth`         | Authentication utilities              | `AuthGuard.tsx`, `use-auth.ts`          |
| `budgets`      | Budget creation, allocation, progress | `budget-actions.ts`, `BudgetCard.tsx`   |
| `categories`   | Transaction categorization            | `category-actions.ts`                   |
| `dashboard`    | Overview widgets, summaries           | `DashboardStats.tsx`                    |
| `investments`  | Portfolio, market data                | `investment-actions.ts`                 |
| `onboarding`   | First-time user setup                 | `actions.ts`, `styles.ts`               |
| `permissions`  | Role-based access control             | `permission-utils.ts`                   |
| `recurring`    | Recurring transaction series          | `recurring-actions.ts`                  |
| `reports`      | Financial analytics                   | `reports-actions.ts`                    |
| `settings`     | User preferences, group config        | `settings-actions.ts`                   |
| `transactions` | Transaction CRUD, filtering           | `transaction-actions.ts`                |

---

## Services Layer

All database operations go through `/src/server/services/`. Services are singleton classes with static methods.

### Service List

| Service                  | Purpose                 | Key Methods                                                        |
| ------------------------ | ----------------------- | ------------------------------------------------------------------ |
| `AccountService`         | Account CRUD            | `createAccount`, `getAccountsByGroup`, `updateBalance`             |
| `BudgetService`          | Budget operations       | `createBudget`, `getBudgetsByGroup`, `updateBudget`                |
| `CategoryService`        | Category management     | `getCategories`, `createCategory`                                  |
| `GroupService`           | Group management        | `createGroup`, `getGroup`, `updateGroup`                           |
| `InvestmentService`      | Portfolio operations    | `createInvestment`, `getInvestmentsByGroup`                        |
| `MarketDataService`      | Stock prices            | `getQuote`, `updatePrices`                                         |
| `PageDataService`        | Page-level aggregations | `getDashboardData`, `getTransactionsPageData`                      |
| `RecurringService`       | Recurring series        | `createSeries`, `getSeriesByGroup`                                 |
| `ReportsService`         | Analytics queries       | `getCategorySpending`, `getMonthlyTrend`                           |
| `TransactionService`     | Transaction CRUD        | `createTransaction`, `getTransactionsByGroup`, `updateTransaction` |
| `UserService`            | User operations         | `create`, `update`, `getLoggedUserInfo`                            |
| `UserPreferencesService` | Preferences             | `getPreferences`, `updatePreferences`                              |

### Service Pattern

```typescript
// Example: TransactionService structure
class TransactionService {
  // Database operations (private)
  private static readonly getByGroupDb = cache(async (...) => { ... });
  private static createDb(data: TransactionInsert): Promise<Transaction>;
  private static updateDb(id: string, data: TransactionUpdate): Promise<Transaction>;
  private static deleteDb(id: string): Promise<Transaction>;

  // Public API methods
  static getTransactionsByGroup(groupId: string, options?: FilterOptions): Promise<{data, total, hasMore}>;
  static createTransaction(input: CreateTransactionInput): Promise<Transaction>;
  static updateTransaction(id: string, input: UpdateTransactionInput): Promise<Transaction>;
  static deleteTransaction(id: string): Promise<Transaction>;
}
```

---

## Stores (Zustand)

Client-side state management in `/src/stores/`:

| Store                       | Purpose                             | Persisted          |
| --------------------------- | ----------------------------------- | ------------------ |
| `page-data-store`           | Page data cache, optimistic updates | No                 |
| `reference-data-store`      | Accounts, categories reference data | No                 |
| `reports-data-store`        | Reports data cache                  | No                 |
| `transaction-filters-store` | Transaction filters state           | No                 |
| `form-draft-store`          | Form draft autosave                 | Yes (localStorage) |
| `user-filter-store`         | Global user filter                  | Yes (localStorage) |
| `ui-state-store`            | UI state (modals, panels)           | No                 |
| `swipe-state-store`         | Swipe gesture state                 | No                 |
| `category-usage-store`      | Category usage tracking             | No                 |

---

## Hooks

### Global Hooks (`/src/hooks/`)

| Hook                  | Purpose                            |
| --------------------- | ---------------------------------- |
| `use-debounced-value` | Debounce values                    |
| `use-infinite-scroll` | Infinite scroll pagination         |
| `use-local-storage`   | localStorage with SSR safety       |
| `use-media-query`     | Responsive breakpoints             |
| `use-mounted`         | Client-only detection              |
| `use-permissions`     | RBAC permission checks             |
| `use-required-user`   | Get authenticated user or redirect |
| `use-stores`          | Access Zustand stores              |
| `use-swipe-manager`   | Touch gesture handling             |
| `use-toast`           | Toast notifications                |

### Data Hooks (`/src/hooks/data/`)

| Hook                      | Purpose               |
| ------------------------- | --------------------- |
| `use-delete-confirmation` | Delete dialog flow    |
| `use-filtered-data`       | Filter data arrays    |
| `use-id-name-map`         | ID to name resolution |

### State Hooks (`/src/hooks/state/`)

| Hook              | Purpose                |
| ----------------- | ---------------------- |
| `use-user-filter` | User filter state      |
| `use-tab-state`   | Tab navigation state   |
| `use-modal-state` | Modal open/close state |

---

## User Flows

### Authentication Flow

```
1. User visits /sign-in or /sign-up
2. Clerk handles authentication UI
3. On success, Clerk redirects to /auth (SSO callback)
4. /auth checks if user exists in DB:
   - If exists: redirect to /dashboard
   - If not exists: redirect to onboarding
```

### Onboarding Flow

```
1. User completes Clerk auth (no DB record yet)
2. Redirect to onboarding page
3. User enters:
   - Profile info (name, email from Clerk)
   - Group name (household/business)
   - Initial accounts (at least 1)
   - Initial budgets (at least 1)
4. completeOnboardingAction() is called:
   - Creates Group record
   - Creates User record with group_id
   - Creates Account records
   - Creates Budget records
5. Invalidates caches, redirects to /dashboard
```

### Transaction CRUD Flow

```
Create:
1. Client calls createTransactionAction(input)
2. Action validates input with Zod
3. TransactionService.createDb() inserts record
4. TransactionService.updateBalancesForTransaction() adjusts account balance
5. Cache invalidation via revalidateTag()
6. Store updated optimistically via page-data-store

Update:
1. Client calls updateTransactionAction(id, input)
2. Service reverts old balance impact
3. Service updates record
4. Service applies new balance impact
5. Cache invalidation

Delete:
1. Client calls deleteTransactionAction(id)
2. Service reverts balance impact
3. Service deletes record
4. Cache invalidation
```

### Modal Flow Pattern

```
1. User clicks "Add" button
2. ui-state-store.openModal('transaction-create') called
3. ModalWrapper renders TransactionForm
4. User fills form, submits
5. Server action called
6. On success: ui-state-store.closeModal()
7. Toast notification shown
8. List refreshes via cache invalidation
```

---

## Mobile Patterns

### Safe Area Handling

```css
/* In globals.css */
.safe-area-pb {
  padding-bottom: env(safe-area-inset-bottom);
}
```

Usage: Apply to fixed bottom elements (BottomNavigation, Drawers).

### Bottom Navigation

- File: `/src/components/layout/BottomNavigation.tsx`
- Fixed to bottom, hidden on scroll down, shown on scroll up
- 5 items: Dashboard, Transactions, Add (FAB), Investments, Reports

### Swipe Gestures

- Hook: `use-swipe-manager`
- Store: `swipe-state-store`
- Supports swipe-to-delete, swipe-to-reveal actions

### Touch Interactions

- Directory: `/src/components/ui/interactions/`
- Components for touch feedback, press-and-hold, drag

### Responsive Drawer

- Component: `/src/components/ui/drawer.tsx` (vaul)
- On mobile: Bottom sheet drawer
- On desktop: Side modal

---

## Styling System

### Design Tokens (`/app/globals.css`)

**Color System (OKLCH)**:

```css
/* Primary - Brand Purple */
--color-primary: oklch(0.595 0.178 270);
--color-primary-foreground: oklch(1 0 0);

/* Secondary - Steel Blue */
--color-secondary: oklch(0.68 0.08 235);

/* Semantic Colors */
--color-success: oklch(0.7 0.15 150); /* Green for income */
--color-destructive: oklch(0.55 0.22 25); /* Red for expenses/errors */
--color-warning: oklch(0.75 0.15 85); /* Amber for warnings */

/* UI Colors */
--color-background: oklch(0.94 0.008 90); /* Light beige */
--color-card: oklch(0.985 0.003 90); /* Soft white */
--color-muted: oklch(0.88 0.008 90); /* Subtle backgrounds */
--color-border: oklch(0.85 0.01 90); /* Borders */
```

**Border Radius**:

```css
--radius: 1rem;
--radius-sm: 0.5rem;
--radius-md: 0.75rem;
--radius-lg: 1rem;
--radius-xl: 1.5rem;
```

**Shadows**:

```css
--shadow-sm: 0 1px 3px 0 oklch(0% 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px oklch(0% 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px oklch(0% 0 0 / 0.1);
```

### Dark Mode

- Controlled by `next-themes`
- Toggle: `@custom-variant dark (&:is(.dark *))`
- Dark overrides in `html.dark { ... }` block
- All colors adjusted for dark backgrounds

### Custom Utilities

```css
/* Glass morphism */
.liquid-glass { ... }
.liquid-glass-strong { ... }

/* Financial colors */
.text-finance-positive { color: var(--color-primary); }
.text-finance-negative { color: var(--color-destructive); }

/* Interactive states */
.hover-lift:hover { transform: translateY(-4px); }
.hover-glow:hover { box-shadow: 0 0 30px var(--color-primary); }

/* Semantic utilities */
@utility card-soft { ... }
@utility text-heading { ... }
@utility icon-container { ... }
```

### Style Objects Pattern

Feature-specific styles in `/src/features/{domain}/theme/{name}-styles.ts`:

```typescript
export const transactionStyles = {
  card: 'bg-card rounded-lg p-4 shadow-sm',
  title: 'text-lg font-semibold text-foreground',
  amount: {
    income: 'text-primary font-bold',
    expense: 'text-destructive font-bold',
  },
};
```

---

## Database Schema

### Core Tables

| Table              | Purpose                | Key Columns                                                             |
| ------------------ | ---------------------- | ----------------------------------------------------------------------- |
| `users`            | User profiles          | `id`, `clerk_id`, `group_id`, `role`, `name`, `email`                   |
| `groups`           | Households/teams       | `id`, `name`, `plan`, `user_ids[]`                                      |
| `accounts`         | Bank accounts          | `id`, `group_id`, `user_ids[]`, `name`, `type`, `balance`               |
| `transactions`     | Financial transactions | `id`, `group_id`, `account_id`, `user_id`, `type`, `amount`, `category` |
| `budgets`          | Budget allocations     | `id`, `group_id`, `user_id`, `categories[]`, `amount`, `type`           |
| `recurring_series` | Recurring templates    | `id`, `group_id`, `frequency`, `next_date`                              |
| `investments`      | Portfolio holdings     | `id`, `group_id`, `symbol`, `shares`, `cost_basis`                      |
| `categories`       | Transaction categories | `id`, `group_id`, `name`, `icon`, `is_system`                           |

### RPC Functions

| Function                           | Purpose                      |
| ---------------------------------- | ---------------------------- |
| `get_group_category_spending`      | Category spending breakdown  |
| `get_group_monthly_spending`       | Monthly income/expense trend |
| `get_group_user_category_spending` | Per-user category spending   |

---

## Testing

### E2E Tests (Playwright)

**Config**: `/playwright.config.ts`

```bash
# Run all tests
npx playwright test

# Run specific test
npx playwright test tests/example.spec.ts

# Run with UI
npx playwright test --ui

# Run headed
npx playwright test --headed
```

**Test Directory**: `/tests/`

**Browsers**: Chromium, Firefox, WebKit

### Unit Tests (Vitest)

```bash
# Run unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

**Testing Libraries**:

- `@testing-library/react` - Component testing
- `@testing-library/dom` - DOM queries
- `@testing-library/user-event` - User interactions
- `jsdom` - Browser environment

---

## Cache Strategy

### Cache Tags (`/src/lib/cache/config.ts`)

```typescript
export const CACHE_TAGS = {
  USERS: 'users',
  USER: (id: string) => `user:${id}`,
  USER_BY_CLERK: (clerkId: string) => `user-clerk:${clerkId}`,
  TRANSACTIONS: 'transactions',
  TRANSACTION: (id: string) => `transaction:${id}`,
  ACCOUNTS: 'accounts',
  BUDGETS: 'budgets',
  // ... etc
};
```

### Cache Invalidation

```typescript
import { revalidateTag } from 'next/cache';

// After mutation
revalidateTag(CACHE_TAGS.TRANSACTIONS);
revalidateTag(CACHE_TAGS.ACCOUNTS);
```

### React Cache

```typescript
import { cache } from 'react';

// Deduplicates requests per render
const getUser = cache(async (id: string) => {
  return await db.users.findUnique({ where: { id } });
});
```

---

## Naming Conventions

### Files

| Type       | Convention                    | Example                  |
| ---------- | ----------------------------- | ------------------------ |
| Components | PascalCase                    | `TransactionCard.tsx`    |
| Hooks      | kebab-case, `use-` prefix     | `use-transactions.ts`    |
| Actions    | kebab-case, `-actions` suffix | `transaction-actions.ts` |
| Services   | kebab-case, `.service` suffix | `transaction.service.ts` |
| Types      | Same as related file          | `transaction.types.ts`   |
| Styles     | kebab-case, `-styles` suffix  | `transaction-styles.ts`  |
| Stores     | kebab-case, `-store` suffix   | `page-data-store.ts`     |

### Code

| Type             | Convention        | Example             |
| ---------------- | ----------------- | ------------------- |
| Components       | PascalCase        | `TransactionCard`   |
| Functions        | camelCase         | `createTransaction` |
| Constants        | SCREAMING_SNAKE   | `CACHE_TAGS`        |
| Types/Interfaces | PascalCase        | `TransactionInput`  |
| Store hooks      | `use[Store]Store` | `usePageDataStore`  |

---

## Common Patterns

### Server Action Pattern

```typescript
'use server';

import { revalidateTag } from 'next/cache';
import { TransactionService } from '@/server/services';
import { CACHE_TAGS } from '@/lib/cache/config';

export async function createTransactionAction(input: CreateTransactionInput) {
  try {
    const result = await TransactionService.createTransaction(input);
    revalidateTag(CACHE_TAGS.TRANSACTIONS);
    return { data: result, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}
```

### Modal Component Pattern

```tsx
export function TransactionModal() {
  const { isOpen, close, data } = useModalState('transaction');

  if (!isOpen) return null;

  return (
    <ModalWrapper onClose={close}>
      <TransactionForm initialData={data} onSuccess={close} />
    </ModalWrapper>
  );
}
```

### Form Pattern

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionSchema, TransactionFormData } from '@/lib/zod';

export function TransactionForm({ onSuccess }) {
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { ... },
  });

  const onSubmit = async (data: TransactionFormData) => {
    const result = await createTransactionAction(data);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Transaction created');
    onSuccess();
  };

  return <form onSubmit={form.handleSubmit(onSubmit)}>...</form>;
}
```

### List with Infinite Scroll Pattern

```tsx
export function TransactionList() {
  const { data, loadMore, hasMore, isLoading } = useInfiniteScroll({
    fetchFn: (offset) => getTransactions({ offset, limit: 20 }),
  });

  return (
    <div>
      {data.map((tx) => (
        <TransactionCard key={tx.id} data={tx} />
      ))}
      {hasMore && <button onClick={loadMore}>Load more</button>}
    </div>
  );
}
```

---

## Agent Instructions

### When Adding a New Feature

1. Create feature folder: `/src/features/{name}/`
2. Add actions in `/actions/` with server action pattern
3. Add components in `/components/`
4. Add hooks in `/hooks/`
5. Add style objects in `/theme/{name}-styles.ts`
6. Export public API in `index.ts`
7. Add service in `/src/server/services/{name}.service.ts`
8. Add cache tags in `/src/lib/cache/config.ts`

### When Adding a New Page

1. Create folder in `/app/(dashboard)/{page}/`
2. Add `page.tsx` (Server Component)
3. Add `loading.tsx` for loading state
4. Fetch data using services in page.tsx
5. Pass data as props to client components

### When Adding a New Component

1. Check if generic → `/src/components/ui/`
2. Check if feature-specific → `/src/features/{feature}/components/`
3. Use style objects, not inline Tailwind
4. Follow existing component patterns

### When Modifying Database

1. Create migration in `/migrations/`
2. Update types in `/src/lib/types/`
3. Update service in `/src/server/services/`
4. Add/update cache tags
5. Update Zod schemas

---

## Environment Variables

```bash
# .env.example
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
CLERK_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

DATABASE_URL=postgresql://...
```

---

## Scripts

| Script              | Purpose                  |
| ------------------- | ------------------------ |
| `npm run dev`       | Start development server |
| `npm run build`     | Production build         |
| `npm run start`     | Start production server  |
| `npm run lint`      | Run ESLint               |
| `npm run typecheck` | Run TypeScript checks    |

---

## Dependencies Quick Reference

### Core

- `next@^16.1.1` - Framework
- `react@^19.2.3` - UI library
- `typescript@^5` - Type system

### Auth

- `@clerk/nextjs@^6.36.5` - Authentication

### Database

- `@supabase/supabase-js@^2.57.4` - Supabase client
- `pg@^8.17.1` - PostgreSQL driver

### UI

- `@radix-ui/*` - Primitive components
- `@headlessui/react@^2.2.9` - Headless UI
- `vaul@^1.1.2` - Drawer component
- `framer-motion@^12.23.12` - Animations
- `lucide-react@^0.542.0` - Icons
- `@remixicon/react@^4.8.0` - Additional icons

### Forms & Validation

- `react-hook-form@^7.69.0` - Form management
- `@hookform/resolvers@^5.2.2` - Zod integration
- `zod@^4.2.1` - Schema validation

### State

- `zustand@^5.0.9` - Client state
- `nuqs@^2.8.6` - URL state

### Styling

- `tailwindcss@^4.1.18` - CSS framework
- `class-variance-authority@^0.7.1` - Variant management
- `clsx@^2.1.1` - Class composition
- `tailwind-merge@^3.3.1` - Class merging

### Charts

- `recharts@^3.7.0` - Data visualization

### Dates

- `date-fns@^4.1.0` - Date utilities
- `luxon@^3.7.2` - Date/time library
- `react-day-picker@^9.11.1` - Date picker

### Testing

- `@playwright/test@^1.58.1` - E2E testing
- `vitest@^4.0.18` - Unit testing
- `@testing-library/react@^16.3.2` - Component testing
