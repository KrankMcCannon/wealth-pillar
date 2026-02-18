# Codebase Structure

**Analysis Date:** 2025-02-13

## Directory Layout

```
[project-root]/
├── app/                # Next.js App Router (Routing, Layouts, Pages)
│   ├── [locale]/       # Localized routes (e.g., /en/home, /it/transactions)
│   └── api/            # API endpoints and webhooks
├── src/
│   ├── components/     # Shared UI components (UI kit, Layout, Shared)
│   ├── features/       # Domain-specific modules (Transactions, Accounts, etc.)
│   ├── hooks/          # Reusable React hooks (State, Data, Utility)
│   ├── i18n/           # Internationalization configuration
│   ├── lib/            # Shared utilities, constants, types, and core logic
│   ├── providers/      # React context providers (Auth, Modal, User)
│   ├── server/         # Server-side logic (Supabase client, Services)
│   ├── stores/         # Global client-side state management (Zustand)
│   └── styles/         # Global styles and system constants
├── messages/           # Translation JSON files (en.json, it.json)
├── scripts/            # Build and utility scripts
└── tests/              # E2E and integration tests (Playwright)
```

## Directory Purposes

**app/[locale]/:**

- Purpose: Contains the actual page structures for each feature.
- Contains: `page.tsx` (Server Components), `*-content.tsx` (Client Components), and Next.js special files like `loading.tsx`, `error.tsx`, `layout.tsx`.
- Key files: `app/[locale]/layout.tsx` (Main shell), `app/[locale]/page.tsx` (Home/Landing).

**src/features/:**

- Purpose: The core of the application logic, grouped by business domain.
- Contains: `actions/` (Server Actions), `components/` (Feature UI), `hooks/` (Feature logic), `constants/`.
- Key directories: `src/features/transactions`, `src/features/investments`, `src/features/accounts`.

**src/server/services/:**

- Purpose: Backend logic and database access.
- Contains: Service classes that encapsulate Supabase queries and business rules.
- Key files: `src/server/services/transaction.service.ts`, `src/server/services/page-data.service.ts`.

**src/components/ui/:**

- Purpose: Reusable, low-level UI elements (often shadcn/ui).
- Contains: Buttons, Inputs, Dialogs, Tooltips, etc.
- Key files: `src/components/ui/button.tsx`, `src/components/ui/dialog.tsx`.

**src/lib/:**

- Purpose: Shared infrastructure code.
- Contains: `utils/` (formatting, validation), `types/` (TypeScript definitions), `auth/` (authentication logic).
- Key files: `src/lib/utils/serializer.ts` (Ensures safe data transfer between SC and CC).

## Key File Locations

**Entry Points:**

- `app/[locale]/home/page.tsx`: Main dashboard entry.
- `app/api/webhooks/clerk/route.ts`: Clerk authentication sync entry.

**Configuration:**

- `next.config.ts`: Next.js build configuration.
- `package.json`: Dependency and script management.
- `tailwind.config.js`: Tailwind CSS styling rules.
- `components.json`: Shadcn/UI configuration.

**Core Logic:**

- `src/server/services/transaction.service.ts`: Core transaction engine.
- `src/lib/utils/transaction-logic.ts`: Shared transaction calculations.

**Testing:**

- `tests/transactions.spec.ts`: Playwright E2E tests for transactions.
- `src/features/transactions/actions/transaction-actions.test.ts`: Integration tests for server actions.

## Naming Conventions

**Files:**

- [Kebab-case]: `transaction-card.tsx`, `use-user-filter.ts`.
- [Feature-content]: `transactions-content.tsx` for client components in `app/`.
- [Feature-service]: `transaction.service.ts` for server-side logic.

**Directories:**

- [Kebab-case]: `shared-components`, `user-management`.

**Components:**

- [PascalCase]: `TransactionCard`, `BottomNavigation`.

## Where to Add New Code

**New Feature:**

- Primary code: Create a new directory in `src/features/[new-feature]`.
- Routing: Add the corresponding route in `app/[locale]/[new-feature]/page.tsx`.
- Tests: Add a new spec file in `tests/`.

**New Component/Module:**

- If domain-specific: Place in `src/features/[domain]/components/`.
- If generic UI: Place in `src/components/ui/`.
- If shared across features: Place in `src/components/shared/` or `src/components/layout/`.

**Utilities:**

- Shared helpers: `src/lib/utils/`.
- Feature-specific helpers: `src/features/[domain]/utils/` (if needed) or directly in a hook.

## Special Directories

**src/stores/:**

- Purpose: Zustand store definitions.
- Generated: No.
- Committed: Yes.

**.planning/codebase/:**

- Purpose: Project documentation and architecture maps (this directory).
- Generated: No (manually updated by mapper).
- Committed: Yes.

---

_Structure analysis: 2025-02-13_
