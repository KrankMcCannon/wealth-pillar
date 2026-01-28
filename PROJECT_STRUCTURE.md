# Project Structure

This document outlines the architecture and logical organization of the Wealth Pillar codebase.

---

## Root Directories

### `/app`

Next.js 14+ App Router directory. Contains all routes, pages, and layouts using the file-system based routing.

#### `/app/(auth)`

Route group for authentication-related pages. Routes are publicly accessible.

- Sign-in, sign-up, and SSO callback pages
- Uses Clerk for authentication

#### `/app/(dashboard)`

Route group for the main authenticated dashboard interface. All routes require authentication.

- **`/accounts`**: Bank accounts management page
- **`/budgets`**: Budget creation, tracking, and analytics
- **`/dashboard`**: Main dashboard overview with financial summary
- **`/investments`**: Investment portfolio tracking and management
- **`/reports`**: Financial reports and analytics
- **`/settings`**: User and group settings configuration
- **`/transactions`**: Transaction list, filtering, and recurring transactions
- **`layout.tsx`**: Shared dashboard layout wrapper
- **`loading.tsx`**: Loading state for dashboard routes

#### `/app/api`

Backend API routes for webhooks and server endpoints.

- **`/webhooks`**: External service webhooks (e.g., Clerk user sync)

#### `/app/globals.css`

Global stylesheet with Tailwind v4 configuration, design tokens (OKLCH color space), and custom utilities.

---

### `/src`

Core application logic, utilities, and reusable components.

#### `/src/components`

Generic, reusable UI components used across multiple features.

- **`/cards`**: Card components (SeriesCard, StatCard, etc.)
- **`/form`**: Form components (FormField, FormSelect, validators)
- **`/layout`**: Layout components (Header, BottomNavigation, PageContainer)
- **`/shared`**: Shared utilities (ConfirmationDialog, EmptyState, TabNavigation)
- **`/ui`**: Base UI components following Shadcn/UI patterns (Button, Input, Modal, etc.)

#### `/src/features`

Feature-specific logic organized by domain. Each feature is self-contained with its own components, hooks, actions, and styles.

**Available features:**

- **`/accounts`**: Bank account management, balance tracking
- **`/auth`**: Authentication logic and utilities
- **`/budgets`**: Budget creation, allocation, and tracking
- **`/categories`**: Transaction categorization system
- **`/dashboard`**: Dashboard widgets and summary cards
- **`/investments`**: Portfolio management and market data
- **`/onboarding`**: User onboarding flow
- **`/permissions`**: Role-based access control (RBAC)
- **`/recurring`**: Recurring transaction series management
- **`/reports`**: Financial reporting and analytics
- **`/settings`**: Settings pages and configuration
- **`/transactions`**: Transaction CRUD operations, filtering, infinite scroll

**Feature structure pattern:**

```
/features/{feature}/
  ├── actions/          # Server actions
  ├── components/       # Feature-specific UI components
  ├── constants/        # Feature constants
  ├── hooks/            # Custom hooks for business logic
  ├── theme/            # Centralized style objects (*-styles.ts)
  └── index.ts          # Barrel export
```

#### `/src/hooks`

Global custom React hooks used across features.

- **`/data`**: Data fetching hooks (useDeleteConfirmation, useFilteredData, useIdNameMap)
- **`/state`**: State management hooks (useUserFilter, useTabState, useModalState)
- Utilities: useDebounce, useInfiniteScroll, useMediaQuery, useLocalStorage

#### `/src/lib`

Shared utilities, types, and helper functions.

- **`/auth`**: Authentication utilities and cached user fetching
- **`/cache`**: Next.js cache keys and configuration
- **`/navigation`**: URL state management utilities
- **`/types`**: TypeScript type definitions and interfaces
- **`/utils`**: Generic utilities (date formatting, currency, serialization)
- **`/zod`**: Zod schema validators

#### `/src/providers`

React Context providers wrapping the application.

- **`ClerkProvider`**: Authentication provider
- **`ThemeProvider`**: Dark/light mode management
- **`ToastProvider`**: Toast notification system

#### `/src/server`

Server-side logic, services, and database access.

- **`/db`**: Supabase client and database connection
- **`/services`**: Business logic services (TransactionService, AccountService, etc.)
  - Service layer pattern for data access and business rules
  - Includes `.logic.ts` files for pure business logic utilities

#### `/src/stores`

Global state management using Zustand.

- **`page-data-store.ts`**: Client-side cache for page data (optimistic updates)
- **`reference-data-store.ts`**: Reference data (accounts, categories)
- **`user-filter-store.ts`**: Global user filter state (persisted to localStorage)

#### `/src/styles`

Centralized style configurations.

- **`system.ts`**: Shared style objects for common patterns (transactionStyles, etc.)

---

### `/scripts`

Utility scripts for maintenance and data operations.

- Database seeding scripts
- Data migration utilities
- Market data updates

---

### `/.agent`

AI agent configuration and workflows (Antigravity).

- **`/workflows`**: Markdown-based workflow definitions for automation
  - Project structure, git commits, component extraction, TypeScript optimization
- **`/brain`**: Agent memory and conversation artifacts (not version controlled)

---

### `/.github`

GitHub configuration.

- **`/workflows`**: CI/CD pipelines (GitHub Actions)

---

### `/migrations`

Database migration files (Supabase migrations).

---

## Architecture Patterns

### Component Organization

- **Presentation components**: In `/src/components` (generic) or `/src/features/{feature}/components` (feature-specific)
- **Business logic**: Extracted to custom hooks in `/hooks` or `/features/{feature}/hooks`
- **Server logic**: In `/src/server/services` with `.service.ts` and `.logic.ts` separation

### Style Management

- **Design tokens**: Defined in `app/globals.css` using OKLCH color space
- **Centralized styles**: Feature-specific styles in `/features/{feature}/theme/*-styles.ts`
- **Pattern**: Avoid hardcoded Tailwind classes; use style objects for consistency

### Data Flow

1. **Server Components** (in `/app`) fetch data using server services
2. **Client Components** receive props and use hooks for interactivity
3. **Stores** (Zustand) manage client-side cache and optimistic updates
4. **Server Actions** (in `/features/{feature}/actions`) handle mutations

### Type Safety

- Strict TypeScript with `--noEmit` checks
- Named interfaces for all function return types
- Semantic tokens instead of raw color values

---

## File Placement Guidelines

| Type                      | Location                                                   |
| ------------------------- | ---------------------------------------------------------- |
| **Pages/Routes**          | `/app/(dashboard)/{page}` or `/app/(auth)/{page}`          |
| **Generic UI Components** | `/src/components/{category}`                               |
| **Feature Components**    | `/src/features/{feature}/components`                       |
| **Business Logic Hooks**  | `/src/features/{feature}/hooks`                            |
| **Server Actions**        | `/src/features/{feature}/actions`                          |
| **Database/Services**     | `/src/server/services`                                     |
| **Type Definitions**      | `/src/lib/types`                                           |
| **Utilities**             | `/src/lib/utils`                                           |
| **Style Objects**         | `/src/features/{feature}/theme` or `/src/styles/system.ts` |

---

## Key Technologies

- **Framework**: Next.js 14+ (App Router, Server Components, Server Actions)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind v4, OKLCH colors, centralized style objects
- **UI**: Custom components following Shadcn/UI patterns
- **Auth**: Clerk
- **Database**: Supabase (PostgreSQL)
- **State**: Zustand (client-side), React Server Components (server-side)
- **Validation**: Zod schemas
- **Forms**: React Hook Form
