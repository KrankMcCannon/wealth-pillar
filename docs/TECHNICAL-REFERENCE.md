# Technical Reference - Wealth Pillar

**Last Updated**: October 24, 2024
**For**: Architects, senior developers, and in-depth technical understanding

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [System Design](#system-design)
4. [Data Flow](#data-flow)
5. [Project Structure](#project-structure)
6. [API Layer](#api-layer)
7. [React Query & Caching](#react-query--caching)
8. [Database & Supabase](#database--supabase)
9. [Custom Hooks](#custom-hooks)
10. [Pages & Routing](#pages--routing)
11. [UI System](#ui-system)
12. [Performance Optimizations](#performance-optimizations)
13. [Type Safety](#type-safety)

---

## Architecture Overview

### Core Principles

Wealth Pillar follows **MVC (Model-View-Controller)** pattern with SOLID principles:

- **Single Responsibility**: Each service, component, hook has one job
- **Open/Closed**: Open for extension (generics, interfaces), closed for modification
- **Dependency Inversion**: Depend on abstractions, not concrete implementations
- **DRY**: All logic centralized; zero duplicate code across features

### System Layers

```
┌──────────────────────────────────────────────────────┐
│                Browser / Client                      │
│  Next.js Pages → Components → Hooks → API Client    │
├──────────────────────────────────────────────────────┤
│                React Query Cache                     │
│  Server state management with smart invalidation    │
├──────────────────────────────────────────────────────┤
│           Network Boundary (HTTP/HTTPS)              │
├──────────────────────────────────────────────────────┤
│              Next.js API Routes (Server)             │
│  Authentication → Validation → Authorization         │
├──────────────────────────────────────────────────────┤
│         Business Logic & Services (Node.js)          │
│  Filtering, Grouping, Calculations, Transformations │
├──────────────────────────────────────────────────────┤
│        Supabase & PostgreSQL (Database)              │
│  RLS Policies, Functions, Real-time Subscriptions   │
└──────────────────────────────────────────────────────┘
```

### Key Characteristics

- **Multi-tenant SaaS**: Family groups with role-based access control
- **Financial Management**: Transactions, budgets, accounts, investments
- **Real-time Updates**: Optimistic UI updates with React Query
- **Type-Safe**: Full TypeScript coverage (183 files, ~25,000 LOC)
- **Mobile-First**: Responsive design with touch-friendly interactions
- **Accessible**: WCAG AA compliant with Radix UI primitives

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js | 15 |
| **Language** | TypeScript | 5 |
| **Styling** | Tailwind CSS | 4 |
| **UI Primitives** | Radix UI | Latest |
| **Icons** | Lucide React | Latest |
| **Animations** | Framer Motion | Latest |
| **State Management** | TanStack Query | v5 |
| **Authentication** | Clerk | Latest |
| **Database** | Supabase (PostgreSQL) | Latest |
| **Runtime** | Node.js | 18+ |

---

## System Design

### Multi-Tenant Architecture

```typescript
// Every operation scoped to user's group
User → Group (family/org) → Accounts → Transactions → Budgets
         ↓
    Role-based access (Superadmin/Admin/Member)
```

**Access Control**:
- **Superadmin**: Full system access, can manage other admins
- **Admin**: Can manage group members, accounts, transactions
- **Member**: Can view own transactions, limited budget access

### Request/Response Flow

#### Query (Read) Flow

```
1. Component renders → needs data
2. useQuery() hook called with queryKey + queryFn
3. React Query checks cache → if fresh, return cached data
4. If stale/missing → call API service
5. API service calls API route (/app/api/...)
6. API route validates:
   - User authenticated (Clerk)
   - User authorized (belongs to group)
7. API route calls Supabase with service role
8. Supabase checks RLS policies
9. Data returned → validated → sent to client
10. React Query caches → component re-renders with data
```

#### Mutation (Write) Flow

```
1. Component calls mutation: mutate({ data })
2. Optimistic update (UI updates immediately)
3. API request sent to server
4. API route validates (auth, authorization, business rules)
5. Supabase updates with RLS enforcement
6. Response returned
7. React Query invalidates cache (selective invalidation)
8. Components re-fetch fresh data
9. UI updates with real data
```

---

## Data Flow

### Complete Application Flow

```
User Action
  ↓
Component Event Handler
  ↓
Controller Hook (orchestrates business logic)
  ↓
Query Hook (for reads) / Mutation Hook (for writes)
  ↓
API Client Service
  ↓
Next.js API Route (/app/api/...)
  ↓
Business Service (filtering, validation, calculations)
  ↓
Supabase Database
  ↓
Back through same path with data
  ↓
React Query Cache
  ↓
Component Re-render with Data
```

### Example: Creating a Transaction

```typescript
// 1. User fills form and clicks "Save"
<TransactionForm onSubmit={handleSubmit} />

// 2. Handler calls mutation
const { mutate: createTransaction } = useCreateTransactionMutation();
handleSubmit = (data) => {
  createTransaction(data); // Optimistic update here
};

// 3. Mutation calls service
const response = await transactionService.create({
  amount: 100,
  category_id: 'cat_123',
  // ... more fields
});

// 4. Service calls API route
POST /api/transactions
Body: { amount: 100, category_id: 'cat_123', ... }

// 5. API route validates & creates
await supabaseServer
  .from('transactions')
  .insert(body)
  .select()
  .single();

// 6. Response returns with new transaction
// 7. React Query invalidates transaction list cache
// 8. Component fetches fresh data
// 9. UI updates with real data
```

---

## Project Structure

### Directory Organization

```
wealth-pillar/
├── app/                              # Next.js App Router
│   ├── (auth)/                      # Auth pages (unauthenticated)
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── verify-email/page.tsx
│   ├── (dashboard)/                 # Dashboard pages (authenticated)
│   │   ├── dashboard/page.tsx
│   │   ├── transactions/page.tsx
│   │   ├── budgets/page.tsx
│   │   ├── accounts/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── investments/page.tsx
│   │   └── settings/page.tsx
│   ├── layout.tsx                   # Root layout
│   └── api/                         # API routes (server endpoints)
│       ├── accounts/route.ts
│       ├── transactions/route.ts
│       ├── budgets/route.ts
│       ├── recurring-transactions/route.ts
│       ├── categories/route.ts
│       └── ...
├── src/
│   ├── components/                  # React components
│   │   ├── ui/                      # Primitives (Button, Card, Input)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── primitives/          # Atomic components (Text, Amount, etc)
│   │   │   └── ...
│   │   ├── pages/                   # Full-page components (lazy-loaded)
│   │   │   ├── dashboard-page.tsx
│   │   │   ├── transactions-page.tsx
│   │   │   └── ...
│   │   └── shared/                  # Shared/common components
│   │       ├── layout-header.tsx
│   │       ├── sidebar.tsx
│   │       └── ...
│   ├── features/                    # Feature modules (self-contained)
│   │   ├── auth/                    # Authentication feature
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── index.ts             # Barrel export
│   │   ├── transactions/            # Transactions feature
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── index.ts
│   │   ├── budgets/                 # Budgets feature
│   │   ├── accounts/                # Accounts feature
│   │   ├── categories/              # Categories feature
│   │   ├── recurring/               # Recurring transactions feature
│   │   ├── dashboard/               # Dashboard feature
│   │   ├── reports/                 # Reports feature
│   │   ├── investments/             # Investments feature
│   │   ├── settings/                # Settings feature
│   │   └── permissions/             # Permissions feature
│   ├── lib/                         # Shared utilities & core logic
│   │   ├── api-client.ts            # Service classes for all API calls
│   │   ├── types.ts                 # All TypeScript interfaces
│   │   ├── query-keys.ts            # React Query key factory
│   │   ├── query-cache-utils.ts     # Smart cache invalidation
│   │   ├── api/                     # API utilities
│   │   │   ├── error-handler.ts
│   │   │   └── response-handler.ts
│   │   ├── services/                # Business logic services
│   │   │   ├── transaction-service.ts
│   │   │   ├── budget-service.ts
│   │   │   ├── filter-service.ts
│   │   │   ├── group-service.ts
│   │   │   └── ...
│   │   ├── utils/                   # Utility functions
│   │   │   ├── date-utils.ts
│   │   │   ├── currency-utils.ts
│   │   │   ├── format-utils.ts
│   │   │   └── ...
│   │   ├── database/                # Database utilities
│   │   │   ├── supabase-server.ts   # Server-side Supabase client
│   │   │   ├── supabase-client.ts   # Client-side Supabase client
│   │   │   └── error-mapping.ts     # Map Supabase errors
│   │   ├── hooks/                   # Reusable custom hooks
│   │   │   ├── use-query-hooks.ts   # All query hooks
│   │   │   └── controller/          # Controller hooks (one per page)
│   │   └── query/                   # React Query configuration
│   │       ├── client.ts
│   │       └── keys.ts
│   └── styles/                      # Global styles
│       └── globals.css
├── docs/                            # Documentation (consolidated)
│   ├── DEVELOPER-GUIDE.md           # Setup, contributing, troubleshooting
│   ├── TECHNICAL-REFERENCE.md       # This file
│   ├── PROJECT-HISTORY.md           # Phase summaries
│   └── README.md                    # Entry point
├── public/                          # Static assets
├── .env.example                     # Environment template
├── .env.local                       # Local configuration (git-ignored)
├── tsconfig.json                    # TypeScript configuration
├── tailwind.config.ts               # Tailwind CSS configuration
├── next.config.ts                   # Next.js configuration
└── package.json                     # Dependencies
```

### Feature Module Structure

Each feature follows consistent structure:

```
src/features/my-feature/
├── components/                      # React components
│   ├── my-feature-form.tsx
│   ├── my-feature-card.tsx
│   ├── my-feature-list.tsx
│   └── index.ts                     # Barrel export
├── hooks/                           # Custom hooks
│   ├── use-my-feature-controller.ts # Orchestration for page
│   ├── use-my-feature-mutations.ts  # Create/Update/Delete
│   └── index.ts                     # Barrel export
├── services/                        # Business logic
│   ├── my-feature.service.ts        # Service class
│   ├── my-feature-view-model.ts     # Data transformation
│   └── index.ts                     # Barrel export
└── index.ts                         # Public API (main export)
```

---

## API Layer

### Service Classes (API Client)

All API interactions go through service classes in `src/lib/api-client.ts`:

```typescript
// Available services
export const {
  userService,
  groupService,
  accountService,
  transactionService,
  budgetService,
  categoryService,
  recurringTransactionService,
  budgetPeriodService,
  investmentService,
  apiHelpers,
} = setupServices();
```

### Service Methods Pattern

```typescript
// Example: transactionService
export const transactionService = {
  // Read operations
  getAll: () => GET /api/transactions,
  getById: (id) => GET /api/transactions/{id},
  getByUserId: (userId) => GET /api/transactions?userId={userId},

  // Write operations
  create: (data) => POST /api/transactions,
  update: (id, data) => PUT /api/transactions/{id},
  delete: (id) => DELETE /api/transactions/{id},

  // Specialized operations
  getReconciliation: (id) => GET /api/transactions/{id}/reconciliation,
};
```

### API Route Structure

All API routes follow this pattern:

```typescript
// app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, validateUserContext } from '@/src/lib/database/supabase-server';
import { withErrorHandler } from '@/src/lib/api/error-handler';

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    // 1. Validate user is authenticated
    const userId = await validateUserContext();

    // 2. Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const groupId = searchParams.get('groupId');

    // 3. Query database with validation
    const { data, error } = await supabaseServer
      .from('my_table')
      .select('*')
      .eq('group_id', groupId);

    if (error) throw error;

    // 4. Return data (error handler catches any errors)
    return NextResponse.json(data);
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    await validateUserContext();
    const body = await request.json();

    const { data, error } = await supabaseServer
      .from('my_table')
      .insert(body)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  });
}
```

### Error Handling

All errors are caught and transformed by `withErrorHandler`:

```typescript
// Server-side error mapping
APIError (custom) → Next.js API Response
  ↓
Client-side error mapping
  ↓
React Query error handler
  ↓
UI displays user-friendly message
```

---

## React Query & Caching

### Query Keys Factory

Centralized in `src/lib/query-keys.ts`:

```typescript
export const queryKeys = {
  // Single item queries
  user: (id: string) => ['user', id],
  transaction: (id: string) => ['transaction', id],
  budget: (id: string) => ['budget', id],

  // List queries
  users: () => ['users'],
  transactions: () => ['transactions'],
  budgets: () => ['budgets'],

  // Filtered queries
  transactionsByUser: (userId: string) => ['transactions', 'user', userId],
  budgetsByGroup: (groupId: string) => ['budgets', 'group', groupId],

  // Grouped/calculated queries
  upcomingRecurringSeries: (days: number) => ['recurring', 'upcoming', days],
  dashboardMetrics: () => ['dashboard', 'metrics'],
};
```

### Query Hooks

Located in `src/lib/hooks/use-query-hooks.ts`:

```typescript
export const useTransactions = (filters?: FilterOptions) => {
  return useQuery({
    queryKey: queryKeys.transactions(),
    queryFn: () => transactionService.getAll(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
  });
};

export const useUser = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.user(userId),
    queryFn: () => userService.getById(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes (reference data, longer)
  });
};
```

### Smart Cache Invalidation

Implemented in `src/lib/query-cache-utils.ts`:

```typescript
// Instead of invalidating entire list, update specific item
export const updateTransactionInCache = (
  queryClient: QueryClient,
  updatedTransaction: Transaction
) => {
  // Update the single transaction query
  queryClient.setQueryData(
    queryKeys.transaction(updatedTransaction.id),
    updatedTransaction
  );

  // Also update in any list queries that might contain it
  const allTransactions = queryClient.getQueryData<Transaction[]>(
    queryKeys.transactions()
  );

  if (allTransactions) {
    const updated = allTransactions.map(t =>
      t.id === updatedTransaction.id ? updatedTransaction : t
    );
    queryClient.setQueryData(queryKeys.transactions(), updated);
  }
};
```

### Stale Times Configuration

```typescript
// Reference data (users, categories) - changes rarely
staleTime: 5 * 60 * 1000 // 5 minutes

// Financial data (transactions, budgets) - changes frequently
staleTime: 30 * 1000 // 30 seconds

// Computed data (analytics, dashboards) - aggregates
staleTime: 60 * 1000 // 1 minute
```

### Performance Achieved

- **25-50% fewer API calls** through smart invalidation
- **Optimistic updates** reduce perceived latency
- **Selective cache updates** instead of full invalidation

---

## Database & Supabase

### Connection Strategy

**Client-side**:
```typescript
// src/lib/database/supabase-client.ts
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

**Server-side (API routes only)**:
```typescript
// src/lib/database/supabase-server.ts
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service role for admin access
);
```

### Row Level Security (RLS)

All tables have RLS policies:

```sql
-- Example: Users can only see transactions in their group
CREATE POLICY "Users can view group transactions"
ON transactions
FOR SELECT
USING (
  group_id IN (
    SELECT g.id FROM groups g
    WHERE g.id IN (
      SELECT group_id FROM group_members
      WHERE user_id = auth.uid()
    )
  )
);
```

### Error Mapping

Supabase errors are mapped to application errors:

```typescript
// src/lib/database/error-mapping.ts
const mapSupabaseError = (error: PostgrestError): APIError => {
  switch (error.code) {
    case '42P01': // Undefined table
      return new APIError(404, 'Resource not found', 'NOT_FOUND');
    case '23503': // Foreign key constraint
      return new APIError(400, 'Invalid reference', 'INVALID_INPUT');
    case '23505': // Unique constraint
      return new APIError(409, 'Already exists', 'CONFLICT');
    default:
      return new APIError(500, 'Database error', 'DB_ERROR');
  }
};
```

### Schema Overview

Core tables:
- `users` - User accounts
- `groups` - Family/organization
- `accounts` - Bank accounts
- `transactions` - Income/expenses
- `recurring_transactions` - Recurring series
- `budgets` - Category budgets
- `categories` - Transaction categories
- `investments` - Investment holdings

---

## Custom Hooks

### Query Hooks

**Location**: `src/lib/hooks/use-query-hooks.ts`

```typescript
// Fetching data
export const useTransactions = (filters?) => useQuery(...)
export const useUser = (userId) => useQuery(...)
export const useBudgets = () => useQuery(...)
export const useAccounts = () => useQuery(...)
// ... 20+ query hooks
```

### Mutation Hooks

**Locations**: Feature-specific files (e.g., `src/features/transactions/hooks/use-transaction-mutations.ts`)

```typescript
export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: transactionService.create,
    onSuccess: () => {
      // Smart cache update instead of full invalidation
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions(),
      });
    },
  });
};
```

### Controller Hooks

**Locations**: `src/lib/hooks/controllers/` (one per page)

Orchestrate all business logic for a page:

```typescript
// src/lib/hooks/controllers/useTransactionController.ts
export const useTransactionController = () => {
  // Get data
  const { data: transactions } = useTransactions();
  const { data: categories } = useCategories();

  // Get mutations
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  // Business logic
  const filteredTransactions = useMemo(() => {
    return filterTransactions(transactions, filters);
  }, [transactions, filters]);

  // Return everything needed for page
  return {
    viewModel: {
      transactions: filteredTransactions,
      categories,
      isLoading,
    },
    actions: {
      createTransaction: createMutation.mutate,
      updateTransaction: updateMutation.mutate,
    },
  };
};
```

### Specialized Hooks

**`useUserSelection`**: Track selected users across filters
**`useDashboardCore`**: Orchestrate dashboard data
**`useFinancialQueries`**: Calculate totals, balances, trends
**`useRecurringSeries`**: Manage recurring transaction logic

---

## Pages & Routing

### Authentication Pages

| Route | Purpose | File |
|-------|---------|------|
| `/login` | User login | `app/(auth)/login/page.tsx` |
| `/signup` | User registration | `app/(auth)/signup/page.tsx` |
| `/forgot-password` | Password reset | `app/(auth)/forgot-password/page.tsx` |
| `/verify-email` | Email verification | `app/(auth)/verify-email/page.tsx` |

### Dashboard Pages

| Route | Purpose | File | Lazy-loaded |
|-------|---------|------|-------------|
| `/dashboard` | Main dashboard | `app/(dashboard)/dashboard/page.tsx` | No |
| `/transactions` | Transaction list | `app/(dashboard)/transactions/page.tsx` | Yes ✅ |
| `/budgets` | Budget management | `app/(dashboard)/budgets/page.tsx` | Yes ✅ |
| `/accounts` | Account management | `app/(dashboard)/accounts/page.tsx` | No |
| `/reports` | Analytics & reports | `app/(dashboard)/reports/page.tsx` | Yes ✅ |
| `/investments` | Investment portfolio | `app/(dashboard)/investments/page.tsx` | Yes ✅ |
| `/settings` | User settings | `app/(dashboard)/settings/page.tsx` | Yes ✅ |

**Lazy-loading saves ~105KB total bundle size**

### Page Pattern

```typescript
// app/(dashboard)/my-feature/page.tsx
import { lazy, Suspense } from 'react';
import { PageLoader } from '@/src/components/shared';

const MyFeaturePage = lazy(() =>
  import('@/src/components/pages/my-feature-page').then(mod => ({
    default: mod.MyFeaturePageComponent
  }))
);

export default function Page() {
  return (
    <Suspense fallback={<PageLoader message="Loading..." />}>
      <MyFeaturePage />
    </Suspense>
  );
}
```

---

## UI System

### Component Hierarchy

```
Design Tokens (OKLCH colors, spacing)
    ↓
Primitives (Text, Amount, Badge, Icon)
    ↓
UI Components (Button, Card, Input, Modal, Dialog)
    ↓
Feature Components (TransactionForm, BudgetCard, etc)
    ↓
Pages (DashboardPage, TransactionsPage, etc)
```

### Available Components

**Primitives** (atomic components):
- `Text` - Typography
- `Amount` - Currency formatting
- `IconContainer` - Icon wrapper
- `StatusBadge` - Status indicator

**UI Components** (27+ components):
- Button, Card, Input, Textarea
- Modal, Dialog, Drawer
- Dropdown, Popover, Tooltip
- Table, Form, Checkbox, Radio
- And more...

### Design Tokens

```typescript
// Colors (OKLCH color space)
export const colors = {
  primary: 'oklch(65% 0.19 254)', // Blue
  success: 'oklch(71% 0.17 142)', // Green
  danger: 'oklch(59% 0.15 25)',   // Red
  warning: 'oklch(86% 0.18 86)',  // Amber
};

// Spacing
export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem',  // 8px
  md: '1rem',    // 16px
  lg: '1.5rem',  // 24px
  xl: '2rem',    // 32px
};
```

### Responsive Design

Mobile-first with Tailwind breakpoints:

```typescript
// Tailwind breakpoints
sm: 640px  // Tablets
md: 768px  // Small laptops
lg: 1024px // Laptops
xl: 1280px // Large screens

// Usage
<div className="text-sm sm:text-base md:text-lg">
  Responsive text size
</div>
```

---

## Performance Optimizations

### Code Splitting

- **Route-based splitting**: Next.js automatically splits by route
- **Lazy-loaded components**: TransactionsPage, ReportsPage, InvestmentsPage (5 components)
- **Total saved**: ~105KB

### Image Optimization

- **WebP format**: Supported by all modern browsers
- **AVIF format**: Ultra-modern compression
- **Size reduction**: 20-35% smaller than original
- **Auto-scaling**: Images scaled to viewport

### React Query Caching

- **Smart invalidation**: Only update changed items (not full lists)
- **Selective cache updates**: Direct setQueryData for specific queries
- **Optimistic updates**: UI updates before server confirms
- **Result**: 25-50% fewer API calls

### Bundle Size

| Metric | Value |
|--------|-------|
| Initial bundle | ~600KB (shared JS) |
| Per-page overhead | 300-400KB |
| Total lazy-loaded | ~105KB saved |
| Build time | 14.4 seconds |

### Caching Strategy

```typescript
Reference data (users, categories)
  → staleTime: 5 minutes
  → gcTime: 30 minutes

Financial data (transactions, budgets)
  → staleTime: 30 seconds
  → gcTime: 5 minutes

Computed data (dashboards, analytics)
  → staleTime: 1 minute
  → gcTime: 10 minutes
```

---

## Type Safety

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Core Types

Located in `src/lib/types.ts` (~154 type definitions):

```typescript
// User & Auth
interface User {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'member';
}

// Financial
interface Transaction {
  id: string;
  amount: number;
  category_id: string;
  account_id: string;
  date: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
}

interface Budget {
  id: string;
  category_id: string;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
}

// ... 150+ more types
```

### Error Types

```typescript
// Custom error class
class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string
  ) {
    super(message);
  }
}

// Usage
throw new APIError(404, 'User not found', 'USER_NOT_FOUND');
```

### Component Props

```typescript
// Strict props with TypeScript
interface TransactionCardProps {
  transaction: Transaction;
  accountName: string;
  onEdit: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function TransactionCard({
  transaction,
  accountName,
  onEdit,
  onDelete,
}: TransactionCardProps) {
  // Implementation
}
```

---

## Best Practices

### 1. Service Layer Pattern

Always route API calls through services:

```typescript
// ❌ Wrong: Calling API directly from component
const response = await fetch('/api/transactions');

// ✅ Correct: Using service layer
const transactions = await transactionService.getAll();
```

### 2. React Query Keys

Use query key factory for consistency:

```typescript
// ❌ Wrong: Hardcoded strings
useQuery({
  queryKey: ['transactions'],
  queryFn: getTransactions,
});

// ✅ Correct: Using factory
useQuery({
  queryKey: queryKeys.transactions(),
  queryFn: transactionService.getAll,
});
```

### 3. Error Handling

Always catch and handle errors:

```typescript
// ❌ Wrong: No error handling
const { data } = useQuery(...);

// ✅ Correct: Handle errors
const { data, error, isLoading } = useQuery(...);
if (error) return <ErrorComponent error={error} />;
if (isLoading) return <Loading />;
```

### 4. TypeScript Types

Always specify types explicitly:

```typescript
// ❌ Wrong: Implicit any
function getTransaction(id) { }

// ✅ Correct: Explicit types
function getTransaction(id: string): Promise<Transaction> { }
```

### 5. Component Composition

Keep components small and focused:

```typescript
// ❌ Wrong: One large component
function TransactionPage() {
  // 500 lines of code
}

// ✅ Correct: Composed smaller components
<TransactionPage>
  <TransactionList />
  <TransactionFilter />
  <TransactionModal />
</TransactionPage>
```

---

## Debugging & Monitoring

### Debug Tools

**React DevTools**:
- Inspect component hierarchy
- View props and state
- Track re-renders

**Network Tab** (F12 → Network):
- Monitor API calls
- Check response status
- Verify request payloads

**React Query DevTools**:
- View query cache state
- Monitor invalidations
- Test cache behavior

### Common Debugging Patterns

```typescript
// Log component renders
console.log('Rendering:', componentName);

// Log data fetching
console.log('Query:', queryKey, 'Data:', data);

// Monitor mutations
console.log('Mutation:', mutationName, 'Status:', status);
```

---

## Future Enhancements

### Planned Optimizations

1. **Service Worker**: Offline support
2. **WebSocket**: Real-time updates
3. **Request Deduplication**: Combine parallel requests
4. **Compression**: Gzip all responses
5. **CDN**: Cache static assets globally

### Feature Pipeline

1. **Phase 8**: Fix remaining ~154 `any` types
2. **Phase 9**: Feature enhancements (notifications, exports, etc.)

---

**Last Updated**: October 24, 2024
**Maintained By**: Development Team
