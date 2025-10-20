# API Documentation

**Version**: 1.0
**Last Updated**: October 2025
**Status**: ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [API Client](#api-client)
3. [Service Classes](#service-classes)
4. [API Routes](#api-routes)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)

---

## Overview

### Architecture

Wealth Pillar uses a **layered API architecture** with server-side validation:

```
┌─────────────────────────────────────────┐
│  React Components                       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  React Query Hooks                      │
│  (hooks/use-query-hooks.ts)            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  API Client Service Layer               │
│  (lib/api-client.ts)                   │
│  - userService                          │
│  - transactionService                   │
│  - budgetService                        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Next.js API Routes                     │
│  (app/api/*/route.ts)                  │
│  - Server-side validation               │
│  - Authorization checks                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Supabase Client                        │
│  (lib/supabase-server.ts)              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  PostgreSQL Database                    │
│  (Row Level Security + Functions)       │
└─────────────────────────────────────────┘
```

### Key Principles

1. **Server-side Validation** - All mutations validated on server
2. **Type Safety** - Full TypeScript coverage
3. **Consistent Errors** - Standardized error responses
4. **Authorization** - Role-based access control (RBAC)
5. **Security** - Never trust client input

---

## API Client

### File: `lib/api-client.ts`

Central API client with service classes for all resources.

### ApiClient Class

**Core HTTP Methods**:

```typescript
class ApiClient {
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T>
  async post<T>(endpoint: string, data?: unknown): Promise<T>
  async put<T>(endpoint: string, data?: unknown): Promise<T>
  async patch<T>(endpoint: string, data?: unknown): Promise<T>
  async delete<T>(endpoint: string): Promise<T>
}
```

**Features**:
- ✅ Automatic JSON serialization
- ✅ Error handling with ApiError
- ✅ Authentication header injection
- ✅ Base URL configuration
- ✅ Network error detection

**Authentication**:
```typescript
export const setApiAuthToken = (token: string | null) => {
  apiClient.setAuthToken(token);
};
```

**Error Handling**:
```typescript
try {
  const data = await transactionService.getAll();
} catch (error) {
  if (error instanceof ApiError) {
    console.error(error.message, error.statusCode, error.code);
  }
}
```

---

## Service Classes

### userService

**File**: `lib/api-client.ts`

Manage users in the application.

#### Methods

```typescript
getAll(): Promise<User[]>
```
Fetch all users in the current group.

**Usage**:
```typescript
const users = await userService.getAll();
```

**API Route**: `GET /api/users`

---

```typescript
getById(id: string): Promise<User>
```
Fetch a single user by ID.

**Parameters**:
- `id: string` - User ID

**Usage**:
```typescript
const user = await userService.getById('user-123');
```

**API Route**: `GET /api/users/[id]`

---

```typescript
create(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User>
```
Create a new user.

**Parameters**:
- `user` - User data without generated fields

**Usage**:
```typescript
const newUser = await userService.create({
  name: 'John Doe',
  email: 'john@example.com',
  role: 'member',
  group_id: 'group-123'
});
```

**API Route**: `POST /api/users`

---

```typescript
update(id: string, user: Partial<User>): Promise<User>
```
Update an existing user.

**Parameters**:
- `id: string` - User ID
- `user: Partial<User>` - Fields to update

**Usage**:
```typescript
const updatedUser = await userService.update('user-123', {
  name: 'Jane Doe',
  role: 'admin'
});
```

**API Route**: `PUT /api/users/[id]`

---

```typescript
delete(id: string): Promise<void>
```
Delete a user.

**Parameters**:
- `id: string` - User ID

**Usage**:
```typescript
await userService.delete('user-123');
```

**API Route**: `DELETE /api/users/[id]`

---

### transactionService

**File**: `lib/api-client.ts`

Manage financial transactions.

#### Methods

```typescript
getAll(): Promise<Transaction[]>
```
Fetch all transactions.

**API Route**: `GET /api/transactions`

---

```typescript
getById(id: string): Promise<Transaction>
```
Fetch a single transaction by ID.

**API Route**: `GET /api/transactions/[id]`

---

```typescript
getByUserId(userId: string): Promise<Transaction[]>
```
Fetch transactions for a specific user.

**Usage**:
```typescript
const transactions = await transactionService.getByUserId('user-123');
```

**API Route**: `GET /api/transactions?userId=user-123`

---

```typescript
getByAccountId(accountId: string): Promise<Transaction[]>
```
Fetch transactions for a specific account.

**API Route**: `GET /api/transactions?accountId=account-123`

---

```typescript
getByDateRange(startDate: string, endDate: string, userId?: string): Promise<Transaction[]>
```
Fetch transactions within a date range.

**Parameters**:
- `startDate: string` - ISO date (YYYY-MM-DD)
- `endDate: string` - ISO date (YYYY-MM-DD)
- `userId?: string` - Optional user filter

**Usage**:
```typescript
const transactions = await transactionService.getByDateRange(
  '2025-01-01',
  '2025-01-31',
  'user-123'
);
```

**API Route**: `GET /api/transactions?startDate=...&endDate=...&userId=...`

---

```typescript
create(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction>
```
Create a new transaction.

**Usage**:
```typescript
const transaction = await transactionService.create({
  user_id: 'user-123',
  account_id: 'account-123',
  amount: 50.00,
  type: 'expense',
  category: 'food',
  description: 'Grocery shopping',
  date: '2025-01-15',
  frequency: 'once'
});
```

**API Route**: `POST /api/transactions`

**Validation**:
- ✅ Amount must be positive
- ✅ Date must be valid ISO format
- ✅ User and account must exist
- ✅ Category must be valid
- ✅ Type must be income/expense/transfer

---

```typescript
update(id: string, transaction: Partial<Transaction>): Promise<Transaction>
```
Update an existing transaction.

**API Route**: `PATCH /api/transactions/[id]`

---

```typescript
delete(id: string): Promise<void>
```
Delete a transaction.

**API Route**: `DELETE /api/transactions/[id]`

---

```typescript
getSummary(startDate: string, endDate: string): Promise<TransactionSummary>
```
Get aggregated summary for a date range.

**Returns**:
```typescript
interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  transactionCount: number;
  categoryBreakdown: { category: string; amount: number }[];
}
```

**API Route**: `GET /api/transactions/summary?startDate=...&endDate=...`

---

```typescript
getTrends(period: 'month' | 'year'): Promise<TrendData[]>
```
Get income/expense trends over time.

**API Route**: `GET /api/transactions/trends?period=month`

---

### budgetService

**File**: `lib/api-client.ts`

Manage budgets and budget periods.

#### Methods

```typescript
getAll(periodId?: string): Promise<Budget[]>
```
Fetch all budgets for a period.

**API Route**: `GET /api/budgets?periodId=...`

---

```typescript
getById(id: string): Promise<Budget>
```
Fetch a single budget by ID.

**API Route**: `GET /api/budgets/[id]`

---

```typescript
create(budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>): Promise<Budget>
```
Create a new budget.

**Usage**:
```typescript
const budget = await budgetService.create({
  description: 'Grocery Budget',
  amount: 500.00,
  period_id: 'period-123',
  categories: ['food', 'household'],
  user_ids: ['user-123']
});
```

**API Route**: `POST /api/budgets`

---

```typescript
update(id: string, budget: Partial<Budget>): Promise<Budget>
```
Update an existing budget.

**API Route**: `PATCH /api/budgets/[id]`

---

```typescript
delete(id: string): Promise<void>
```
Delete a budget.

**API Route**: `DELETE /api/budgets/[id]`

---

```typescript
getAnalysis(budgetId: string): Promise<BudgetAnalysis>
```
Get detailed budget analysis with charts.

**Returns**:
```typescript
interface BudgetAnalysis {
  budget: Budget;
  spent: number;
  remaining: number;
  progress: number;
  dailySpending: { date: string; amount: number }[];
  categoryBreakdown: { category: string; amount: number }[];
}
```

**API Route**: `GET /api/budgets/[id]/analysis`

---

### budgetPeriodService

**File**: `lib/api-client.ts`

Manage budget periods.

#### Methods

```typescript
getAll(): Promise<BudgetPeriod[]>
```
Fetch all budget periods.

**API Route**: `GET /api/budget-periods`

---

```typescript
getCurrent(): Promise<BudgetPeriod | null>
```
Fetch the currently active period.

**API Route**: `GET /api/budget-periods/current`

---

```typescript
create(period: Omit<BudgetPeriod, 'id' | 'created_at'>): Promise<BudgetPeriod>
```
Create a new budget period.

**API Route**: `POST /api/budget-periods`

---

```typescript
end(periodId: string): Promise<BudgetPeriod>
```
End a budget period and create a new one.

**API Route**: `POST /api/budget-periods/end`

**Behavior**:
1. Marks current period as ended
2. Creates new period starting today
3. Copies budgets from previous period (optional)

---

### categoryService

**File**: `lib/api-client.ts`

Manage transaction categories.

#### Methods

```typescript
getAll(): Promise<Category[]>
```
Fetch all categories.

**API Route**: `GET /api/categories`

---

```typescript
create(category: Omit<Category, 'id'>): Promise<Category>
```
Create a new category.

**Usage**:
```typescript
const category = await categoryService.create({
  key: 'groceries',
  label: 'Groceries',
  icon: '🛒',
  color: '#22C55E'
});
```

**API Route**: `POST /api/categories`

---

```typescript
update(id: string, category: Partial<Category>): Promise<Category>
```
Update an existing category.

**API Route**: `PATCH /api/categories/[id]`

---

```typescript
delete(id: string): Promise<void>
```
Delete a category.

**API Route**: `DELETE /api/categories/[id]`

**Note**: Cannot delete if category is used in transactions

---

### accountService

**File**: `lib/api-client.ts`

Manage financial accounts.

#### Methods

```typescript
getAll(): Promise<Account[]>
```
Fetch all accounts.

**API Route**: `GET /api/accounts`

---

```typescript
getByUserId(userId: string): Promise<Account[]>
```
Fetch accounts for a specific user.

**API Route**: `GET /api/accounts?userId=user-123`

---

```typescript
create(account: Omit<Account, 'id' | 'created_at'>): Promise<Account>
```
Create a new account.

**Usage**:
```typescript
const account = await accountService.create({
  name: 'Checking Account',
  type: 'payroll',
  user_ids: ['user-123'],
  group_id: 'group-123'
});
```

**API Route**: `POST /api/accounts`

---

```typescript
update(id: string, account: Partial<Account>): Promise<Account>
```
Update an existing account.

**API Route**: `PATCH /api/accounts/[id]`

---

```typescript
delete(id: string): Promise<void>
```
Delete an account.

**API Route**: `DELETE /api/accounts/[id]`

**Note**: Cannot delete if account has transactions

---

### recurringTransactionService

**File**: `lib/api-client.ts`

Manage recurring transaction series.

#### Methods

```typescript
getAll(): Promise<RecurringTransactionSeries[]>
```
Fetch all recurring series.

**API Route**: `GET /api/recurring-transactions`

---

```typescript
getUpcoming(days: number, userId?: string): Promise<RecurringTransactionSeries[]>
```
Fetch series due within N days.

**API Route**: `GET /api/recurring-transactions?upcoming=7&userId=...`

---

```typescript
getMissed(): Promise<MissedExecution[]>
```
Fetch missed recurring executions.

**API Route**: `GET /api/recurring-transactions/missed`

---

```typescript
create(series: Omit<RecurringTransactionSeries, 'id' | 'created_at'>): Promise<RecurringTransactionSeries>
```
Create a new recurring series.

**Usage**:
```typescript
const series = await recurringTransactionService.create({
  description: 'Monthly Rent',
  amount: 1200.00,
  type: 'expense',
  category: 'housing',
  frequency: 'monthly',
  due_date: '2025-02-01',
  user_id: 'user-123',
  account_id: 'account-123'
});
```

**API Route**: `POST /api/recurring-transactions`

---

```typescript
update(id: string, series: Partial<RecurringTransactionSeries>): Promise<RecurringTransactionSeries>
```
Update an existing series.

**API Route**: `PATCH /api/recurring-transactions/[id]`

---

```typescript
delete(id: string): Promise<void>
```
Delete a recurring series.

**API Route**: `DELETE /api/recurring-transactions/[id]`

---

```typescript
execute(seriesId: string): Promise<Transaction>
```
Manually execute a recurring transaction.

**API Route**: `POST /api/recurring-transactions/[id]/execute`

---

```typescript
executeAll(maxDaysOverdue?: number): Promise<ExecutionResult>
```
Execute all due recurring transactions.

**Returns**:
```typescript
interface ExecutionResult {
  summary: {
    totalProcessed: number;
    successfulExecutions: number;
    failedExecutions: number;
    totalAmount: number;
  };
  successful: { seriesId: string; transactionId: string }[];
  failed: { seriesId: string; error: string }[];
}
```

**API Route**: `POST /api/recurring-transactions/execute-all`

---

### investmentService

**File**: `lib/api-client.ts`

Manage investment holdings (stub implementation).

#### Methods

```typescript
getAll(): Promise<InvestmentHolding[]>
```
Fetch all investment holdings.

**API Route**: `GET /api/investments`

---

```typescript
create(holding: Omit<InvestmentHolding, 'id'>): Promise<InvestmentHolding>
```
Create a new investment holding.

**API Route**: `POST /api/investments`

---

```typescript
update(id: string, holding: Partial<InvestmentHolding>): Promise<InvestmentHolding>
```
Update an existing holding.

**API Route**: `PATCH /api/investments/[id]`

---

```typescript
delete(id: string): Promise<void>
```
Delete a holding.

**API Route**: `DELETE /api/investments/[id]`

---

## API Routes

### Overview

**Total Routes**: 19+ route files in `app/api/`

**Route Structure**:
```
/api
  /users
    route.ts                 # GET, POST
    /[id]
      route.ts              # GET, PUT, DELETE
  /transactions
    route.ts                # GET, POST
    /[id]
      route.ts              # GET, PATCH, DELETE
    /summary
      route.ts              # GET
    /trends
      route.ts              # GET
  /budgets
    route.ts                # GET, POST
    /[id]
      route.ts              # GET, PATCH, DELETE
      /analysis
        route.ts            # GET
  /budget-periods
    route.ts                # GET, POST
    /current
      route.ts              # GET
    /end
      route.ts              # POST
  /categories
    route.ts                # GET, POST, PATCH, DELETE
  /accounts
    route.ts                # GET, POST, PATCH, DELETE
  /recurring-transactions
    route.ts                # GET, POST
    /missed
      route.ts              # GET
    /execute-all
      route.ts              # POST
  /[...path]
    route.ts                # Catch-all for Supabase Edge Functions
```

### Route Pattern

**Standard CRUD Route**:

```typescript
// app/api/resources/route.ts
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import { resourceService } from '@/lib/services/resource.service';

// GET /api/resources
export async function GET(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter');

    const resources = await resourceService.getAll(userId, filter);
    return NextResponse.json({ data: resources });
  } catch (error) {
    console.error('GET /api/resources error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    );
  }
}

// POST /api/resources
export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validation = validateResourceInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const resource = await resourceService.create(userId, body);
    return NextResponse.json({ data: resource }, { status: 201 });
  } catch (error) {
    console.error('POST /api/resources error:', error);
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}
```

**Dynamic Route**:

```typescript
// app/api/resources/[id]/route.ts
import { auth } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

// GET /api/resources/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resource = await resourceService.getById(params.id, userId);
  if (!resource) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ data: resource });
}

// PATCH /api/resources/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const resource = await resourceService.update(params.id, userId, body);

  return NextResponse.json({ data: resource });
}

// DELETE /api/resources/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await resourceService.delete(params.id, userId);
  return NextResponse.json({ success: true });
}
```

### Catch-All Route

**File**: `app/api/[...path]/route.ts`

Forwards requests to Supabase Edge Functions.

```typescript
export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const supabase = createServerClient();
  const path = params.path.join('/');

  // Forward to Supabase Edge Function
  const { data, error } = await supabase.functions.invoke(path, {
    method: 'GET',
    headers: request.headers,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

---

## Error Handling

### ApiError Class

**File**: `lib/api-client.ts`

```typescript
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

**Usage**:
```typescript
try {
  await transactionService.create(data);
} catch (error) {
  if (error instanceof ApiError) {
    if (error.statusCode === 401) {
      // Handle unauthorized
      router.push('/sign-in');
    } else if (error.statusCode === 400) {
      // Handle validation error
      toast.error(error.message);
    } else {
      // Handle generic error
      toast.error('Something went wrong');
    }
  }
}
```

### Standard Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Not authorized |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input |
| `CONFLICT` | 409 | Resource conflict |
| `SERVER_ERROR` | 500 | Internal server error |
| `NETWORK_ERROR` | 0 | Network failure |

### Error Response Format

**Standard Format**:
```json
{
  "error": "User-friendly error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Field-specific error"
  }
}
```

**Success Response Format**:
```json
{
  "data": { /* resource data */ }
}
```

---

## Best Practices

### API Client Usage

1. **Always use service classes** - Never call `fetch` directly
2. **Handle errors gracefully** - Use try/catch with ApiError
3. **Use TypeScript types** - Leverage full type safety
4. **Validate on server** - Don't trust client input
5. **Return consistent responses** - Follow standard format

### Service Layer

1. **Single responsibility** - One service per resource
2. **Predictable naming** - `getAll`, `getById`, `create`, `update`, `delete`
3. **Type all inputs/outputs** - Full TypeScript coverage
4. **Document parameters** - Clear JSDoc comments
5. **Handle edge cases** - Null checks, empty arrays

### API Route Development

1. **Always authenticate** - Check `auth()` in every route
2. **Validate input** - Never trust request body
3. **Check authorization** - RBAC for resource access
4. **Log errors** - Console.error with context
5. **Return proper status codes** - 200, 201, 400, 401, 404, 500

### Security

1. **Server-side validation** - All mutations validated
2. **Row Level Security** - Database-level protection
3. **Rate limiting** - (Future) Prevent abuse
4. **Input sanitization** - Prevent injection attacks
5. **HTTPS only** - Production environment

---

**Status**: ✅ Production Ready
**Last Updated**: October 2025
**Maintainer**: Wealth Pillar Team
