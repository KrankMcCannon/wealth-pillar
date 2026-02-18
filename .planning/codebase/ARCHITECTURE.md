# Architecture

**Analysis Date:** 2025-02-13

## Pattern Overview

**Overall:** Hybrid Server/Client Architecture with Feature-Driven Design

The system leverages Next.js App Router, combining Server Components for initial data fetching and SEO with Client Components for rich interactivity. Business logic is strictly separated into feature-specific hooks and server-side services.

**Key Characteristics:**
- **Server-First Data Fetching:** Initial page data is fetched in Server Components to minimize client-side waterfalls.
- **Optimistic UI:** Client-side state management (Zustand) is used to provide immediate feedback for mutations.
- **Feature-Based Modularization:** Code is organized by domain (e.g., transactions, investments) rather than technical type.
- **Layered Service Architecture:** Database interactions and complex business logic are encapsulated in a dedicated service layer.

## Layers

**Routing & Entry Points:**
- Purpose: Handles navigation, localization, and initial data orchestration.
- Location: `app/`
- Contains: Next.js pages, layouts, and loading states.
- Depends on: `src/server/services`, `src/features`, `src/lib/auth`.
- Used by: End users.

**Feature Layer:**
- Purpose: Encapsulates UI and business logic for a specific domain.
- Location: `src/features/`
- Contains: Components, hooks, server actions, and domain-specific constants.
- Depends on: `src/components`, `src/hooks`, `src/server/services` (via server actions).
- Used by: `app/` (Routing layer).

**Service Layer:**
- Purpose: Provides a clean API for database operations and complex server-side logic.
- Location: `src/server/services/`
- Contains: Service classes (e.g., `TransactionService`).
- Depends on: `src/server/db` (Supabase), `src/lib/utils`.
- Used by: Server Components in `app/` and Server Actions in `src/features/`.

**Global State Layer:**
- Purpose: Manages shared application state and facilitates optimistic UI.
- Location: `src/stores/`
- Contains: Zustand stores (e.g., `ui-state-store.ts`, `page-data-store.ts`).
- Depends on: Zustand.
- Used by: Client-side hooks in `src/features/` and `src/hooks/`.

## Data Flow

**Initial Page Load:**
1. Next.js router hits a Server Component (e.g., `app/[locale]/transactions/page.tsx`).
2. Server Component calls a Service (e.g., `PageDataService.getTransactionsPageData`).
3. Service fetches data from Supabase and applies caching logic.
4. Server Component passes data as props to a Client Component ("Content" component).
5. Client Component populates its local or global store via hooks (e.g., `useTransactionsContent`).

**Mutations & State Updates:**
1. User triggers an action (e.g., Delete Transaction).
2. Client hook updates the Zustand store optimistically (`removeTransactionFromStore`).
3. Client hook calls a Server Action (e.g., `deleteTransactionAction`).
4. Server Action validates permissions and calls the Service Layer.
5. Service Layer updates the database and invalidates Next.js cache tags.
6. If the Server Action fails, the Client hook reverts the optimistic update in the store.

**State Management:**
- **Global UI State:** Managed by `src/stores/ui-state-store.ts` (persisted to localStorage).
- **Domain Data State:** Managed by `src/stores/page-data-store.ts` for optimistic updates.
- **URL-based State:** Tabs and modal visibility are often synced with URL search params via `src/lib/navigation/url-state.ts`.

## Key Abstractions

**Services:**
- Purpose: Single source of truth for domain logic and DB access.
- Examples: `src/server/services/transaction.service.ts`, `src/server/services/investment.service.ts`.
- Pattern: Static class methods with `server-only` protection.

**Business Logic Hooks:**
- Purpose: Encapsulates complex UI logic, filtering, and event handlers.
- Examples: `src/features/transactions/hooks/useTransactionsContent.ts`.
- Pattern: Custom React hooks returning a flattened object of state and handlers.

**Server Actions:**
- Purpose: Secure bridge between Client Components and the Service Layer.
- Examples: `src/features/transactions/actions/transaction-actions.ts`.
- Pattern: Async functions with `'use server'` directive, returning a `{ data, error }` result.

## Entry Points

**Localized Pages:**
- Location: `app/[locale]/[feature]/page.tsx`
- Triggers: URL Navigation.
- Responsibilities: Auth checks, parallel data fetching, rendering layout and content.

**API Webhooks:**
- Location: `app/api/webhooks/clerk/route.ts`
- Triggers: External service events (e.g., Clerk user creation).
- Responsibilities: Synchronizing external state with the internal database.

## Error Handling

**Strategy:** Multi-layered defensive programming.

**Patterns:**
- **Server-side:** Services throw descriptive errors; Server Actions catch them and return a standardized error object.
- **Client-side:** Hooks handle error results from actions by reverting optimistic updates and showing toast notifications via `useToast`.
- **UI:** Next.js `error.tsx` files handle unhandled exceptions at the route level.

## Cross-Cutting Concerns

**Logging:** Uses structured console logging in development; potentially connected to external monitors.
**Validation:** Centralized utilities in `src/lib/utils/validation-utils.ts` used by services.
**Authentication:** Managed via Clerk, with helpers in `src/lib/auth/cached-auth.ts` for server-side access control.

---

*Architecture analysis: 2025-02-13*
