# Database System Documentation

**Version**: 1.0
**Last Updated**: October 20, 2025
**Status**: Production Ready ✅

---

## Table of Contents

1. [Overview](#overview)
2. [Database Architecture](#database-architecture)
3. [Supabase Integration](#supabase-integration)
4. [Database Schema](#database-schema)
5. [Database Types](#database-types)
6. [Database Functions](#database-functions)
7. [Row Level Security (RLS)](#row-level-security-rls)
8. [Error Handling](#error-handling)
9. [Data Access Patterns](#data-access-patterns)
10. [Query Helpers](#query-helpers)
11. [Environment Configuration](#environment-configuration)
12. [Best Practices](#best-practices)

---

## Overview

Wealth Pillar uses **Supabase** as its database platform, providing:
- **PostgreSQL** database with modern features
- **Row Level Security (RLS)** for data isolation
- **Real-time subscriptions** (not currently utilized)
- **Database functions** for server-side calculations
- **TypeScript type generation** for full type safety
- **Clerk integration** for authentication

### Key Characteristics

- **Multi-tenant Architecture**: Family groups with shared data access
- **Role-based Access Control**: Superadmin, Admin, Member roles
- **Server-side Validation**: All database operations go through Next.js API routes
- **Type Safety**: Full TypeScript coverage from database to UI
- **Error Mapping**: Comprehensive PostgreSQL error code mapping to Italian messages

---

## Database Architecture

### Technology Stack

```
┌─────────────────────────────────────────────────┐
│              Next.js Application                │
├─────────────────────────────────────────────────┤
│         API Routes + Validation Layer           │
├─────────────────────────────────────────────────┤
│    Supabase Client (Browser) / Server (API)    │
├─────────────────────────────────────────────────┤
│            PostgreSQL Database                  │
│  - Tables with RLS                             │
│  - Database Functions                          │
│  - Triggers & Constraints                      │
└─────────────────────────────────────────────────┘
```

### Client Types

**1. Browser Client** (`lib/supabase-client.ts`)
- Used for client-side operations
- Anonymous key access (limited by RLS)
- Read-only operations preferred

**2. Server Client** (`lib/supabase-server.ts`)
- Used in API routes
- Service role key (bypasses RLS)
- All write operations
- User context validation via Clerk

---

## Supabase Integration

### Browser Client

**File**: `lib/supabase-client.ts`

```typescript
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
```

**Use Cases**:
- Client-side reads (with RLS protection)
- Real-time subscriptions
- File uploads (future feature)

**Security**: Limited by Row Level Security policies, can only access data the authenticated user is authorized to see.

---

### Server Client

**File**: `lib/supabase-server.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { auth, currentUser } from '@clerk/nextjs/server';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseServer = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

**Use Cases**:
- All write operations (create, update, delete)
- Server-side reads with complex joins
- Admin operations
- Batch operations

**Security**: Full database access, requires manual validation of user context and permissions.

---

### Key Server Functions

#### 1. Response Handler

```typescript
export function handleServerResponse<T>(response: {
  data: T | null;
  error: unknown;
}): T {
  if (response.error) {
    throw mapSupabaseError(response.error);
  }

  if (response.data === null) {
    throw new APIError(ErrorCode.RESOURCE_NOT_FOUND);
  }

  return response.data;
}
```

**Purpose**: Converts Supabase responses to typed data or throws structured errors.

**Usage Example**:
```typescript
const user = handleServerResponse(
  await supabaseServer.from('users').select('*').eq('id', userId).single()
);
```

---

#### 2. User Context Validation

```typescript
export async function validateUserContext(): Promise<{
  userId: string;
  email: string;
  role: string;
  group_id: string;
}> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    throw new APIError(ErrorCode.AUTH_REQUIRED);
  }

  const userResponse = await supabaseServer
    .from('users')
    .select('id, email, role, group_id')
    .eq('clerk_id', clerkUserId)
    .single();

  if (userResponse.data) {
    return {
      userId: userResponse.data.id,
      email: userResponse.data.email,
      role: userResponse.data.role,
      group_id: userResponse.data.group_id,
    };
  }

  // Fallback: map by email if clerk_id not set
  const clerkUser = await currentUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress;
  // ... (see full implementation in lib/supabase-server.ts)
}
```

**Purpose**: Links Clerk authentication to database user records.

**Flow**:
1. Get Clerk user ID from session
2. Look up database user by `clerk_id`
3. Fallback to email lookup if needed
4. Return user context for authorization

---

#### 3. Resource Access Validation

```typescript
export async function validateResourceAccess(
  userId: string,
  resourceType: 'transaction' | 'budget' | 'account' | 'recurring_series',
  resourceId?: string,
  requiredRole?: 'superadmin' | 'admin' | 'member'
): Promise<boolean> {
  // Role hierarchy check
  if (requiredRole) {
    const roleHierarchy = { superadmin: 3, admin: 2, member: 1 };
    // ...
  }

  // Resource ownership check
  switch (resourceType) {
    case 'transaction':
      // Check if user owns transaction or has group access
      break;
    // ... (other resource types)
  }
}
```

**Purpose**: Validates user permissions for accessing/modifying resources.

**Authorization Rules**:
- **Superadmin**: Full access to all resources
- **Admin**: Access to all group resources
- **Member**: Access to own resources only
- **Group Access**: Users in same group can access each other's data

---

#### 4. Pagination Helper

```typescript
export function applyPagination<Q extends PaginatableQuery>(
  query: Q,
  options: PaginationOptions = {}
): Q {
  const { page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'desc' } = options;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  return query
    .range(from, to)
    .order(sortBy, { ascending: sortOrder === 'asc' }) as Q;
}
```

**Usage**:
```typescript
let query = supabaseServer.from('transactions').select('*');
query = applyPagination(query, { page: 2, limit: 20, sortBy: 'date' });
const { data } = await query;
```

---

#### 5. Date Filter Helper

```typescript
export function applyDateFilter<Q>(
  query: Q & DateFilterableQuery,
  options: DateFilterOptions = {}
): Q {
  const { startDate, endDate, dateField = 'date' } = options;

  if (startDate) {
    query = query.gte(dateField, startDate);
  }
  if (endDate) {
    query = query.lte(dateField, endDate);
  }

  return query;
}
```

**Usage**:
```typescript
let query = supabaseServer.from('transactions').select('*');
query = applyDateFilter(query, {
  startDate: '2025-01-01',
  endDate: '2025-12-31'
});
```

---

## Database Schema

### Tables Overview

| Table | Purpose | Key Fields | Relationships |
|-------|---------|------------|---------------|
| `users` | User profiles | id, email, role, group_id | Belongs to group |
| `groups` | Family/org groups | id, name, plan, user_ids | Has many users |
| `accounts` | Bank accounts | id, name, type, user_ids | Belongs to group |
| `transactions` | Financial transactions | id, amount, type, category | Belongs to user/account |
| `recurring_transactions` | Recurring series | id, frequency, start_date | Has many transactions |
| `budgets` | Budget definitions | id, amount, categories | Belongs to user |
| `categories` | Expense categories | id, label, key, icon | Reference data |

---

### Detailed Schema

#### 1. Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar VARCHAR(512),
  theme_color VARCHAR(7) DEFAULT '#7578EC',
  budget_start_date INT DEFAULT 1,
  group_id UUID REFERENCES groups(id),
  role VARCHAR(20) CHECK (role IN ('superadmin', 'admin', 'member')) DEFAULT 'member',
  budget_periods JSONB DEFAULT '[]',
  clerk_id VARCHAR(255) UNIQUE,
  default_account_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Features**:
- **clerk_id**: Links to Clerk authentication system
- **role**: Role-based access control (superadmin > admin > member)
- **budget_start_date**: Day of month when budget periods start (1-31)
- **theme_color**: User's personalized color in hex format
- **budget_periods**: JSONB array of budget period tracking

**Constraints**:
- Unique email for user identification
- Unique clerk_id for authentication mapping
- Valid role enum values

---

#### 2. Groups Table

```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  user_ids UUID[] DEFAULT '{}',
  plan JSONB DEFAULT '{"type": "free", "name": "Free Plan"}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Features**:
- **user_ids**: Array of user IDs in the group (denormalized for performance)
- **plan**: JSONB object with `type` ('premium'/'free') and `name`
- **is_active**: Soft delete flag for group deactivation

**Plan Structure**:
```typescript
{
  type: 'premium' | 'free',
  name: string
}
```

---

#### 3. Accounts Table

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('payroll', 'savings', 'cash', 'investments')) NOT NULL,
  user_ids UUID[] NOT NULL,
  group_id UUID REFERENCES groups(id) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Account Types**:
- **payroll**: Main checking account (Conto Corrente)
- **savings**: Savings account (Conto Risparmio)
- **cash**: Cash on hand (Contanti)
- **investments**: Investment account (Investimenti)

**Key Features**:
- **user_ids**: Array of users who can access this account
- **group_id**: Group ownership for access control

---

#### 4. Transactions Table

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('income', 'expense', 'transfer')) NOT NULL,
  category VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  user_id UUID REFERENCES users(id),
  account_id UUID REFERENCES accounts(id) NOT NULL,
  to_account_id UUID REFERENCES accounts(id),
  group_id UUID REFERENCES groups(id),
  recurring_series_id UUID REFERENCES recurring_transactions(id),
  frequency VARCHAR(20) CHECK (frequency IN ('once', 'weekly', 'biweekly', 'monthly', 'yearly')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
```

**Transaction Types**:
- **income**: Money coming in
- **expense**: Money going out
- **transfer**: Money moving between accounts (requires `to_account_id`)

**Key Features**:
- **recurring_series_id**: Links to recurring template if auto-generated
- **to_account_id**: Destination account for transfers
- **frequency**: Original frequency if part of series
- **group_id**: For group-level reporting

**Indexes**: Optimized for common queries (user, date, category, account)

---

#### 5. Recurring Transactions Table

```sql
CREATE TABLE recurring_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('income', 'expense', 'transfer')) NOT NULL,
  category VARCHAR(100) NOT NULL,
  frequency VARCHAR(20) CHECK (frequency IN ('once', 'weekly', 'biweekly', 'monthly', 'yearly')) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  account_id UUID REFERENCES accounts(id) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  due_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  total_executions INT DEFAULT 0,
  transaction_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_recurring_due_date ON recurring_transactions(due_date);
CREATE INDEX idx_recurring_user_id ON recurring_transactions(user_id);
```

**Key Features**:
- **frequency**: How often the transaction repeats
- **start_date**: When series begins
- **end_date**: When series ends (null = indefinite)
- **due_date**: Next scheduled execution date
- **is_active**: Whether series is currently generating transactions
- **total_executions**: Count of transactions generated
- **transaction_ids**: Array of generated transaction IDs

**Frequency Calculation**:
- **weekly**: Every 7 days
- **biweekly**: Every 14 days
- **monthly**: Same day each month
- **yearly**: Same date each year

---

#### 6. Budgets Table

```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('monthly', 'annually')) NOT NULL,
  icon VARCHAR(50),
  categories TEXT[] NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  group_id UUID REFERENCES groups(id) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
```

**Key Features**:
- **categories**: Array of category keys this budget applies to
- **type**: Budget period (monthly or annually)
- **icon**: Optional emoji/icon identifier
- **amount**: Total budget limit

**Example**:
```json
{
  "description": "Entertainment Budget",
  "amount": 200.00,
  "type": "monthly",
  "categories": ["entertainment", "dining", "hobbies"]
}
```

---

#### 7. Categories Table

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label VARCHAR(100) NOT NULL,
  key VARCHAR(50) UNIQUE NOT NULL,
  icon VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Key Features**:
- **key**: Unique identifier for programmatic access
- **label**: Human-readable display name (Italian)
- **icon**: Lucide icon name
- **color**: Hex color for UI display

**Example Categories**:
```json
[
  { "key": "groceries", "label": "Spesa", "icon": "ShoppingCart", "color": "#10b981" },
  { "key": "transport", "label": "Trasporti", "icon": "Car", "color": "#3b82f6" },
  { "key": "entertainment", "label": "Intrattenimento", "icon": "Film", "color": "#8b5cf6" }
]
```

---

## Database Types

### TypeScript Type System

**Files**:
- `lib/database.types.ts` - Generated Supabase types
- `lib/types.ts` - Application domain types

### Generated Database Types

**File**: `lib/database.types.ts`

```typescript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          avatar: string;
          theme_color: string;
          budget_start_date: number;
          group_id: string;
          role: 'superadmin' | 'admin' | 'member';
          budget_periods: unknown; // jsonb
          clerk_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          // ... (optional fields)
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          // ... (all fields optional)
        };
      };
      // ... (other tables)
    };
    Functions: {
      get_transactions_by_user: { Args: { ... }; Returns: Transaction[] };
      calculate_account_balance: { Args: { ... }; Returns: number };
      // ...
    };
  };
}
```

**Type Usage**:
- **Row**: Type for reading data from database
- **Insert**: Type for creating new records (optional fields)
- **Update**: Type for updating records (all fields optional)

---

### Application Domain Types

**File**: `lib/types.ts`

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  theme_color: string;
  budget_start_date: number;
  group_id: string;
  role: RoleType;
  budget_periods: BudgetPeriod[];
  clerk_id?: string;
  default_account_id?: string;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string | Date;
  user_id: string;
  account_id: string;
  to_account_id?: string | null;
  frequency?: TransactionFrequencyType;
  recurring_series_id?: string | null;
  group_id?: string;
  created_at: string | Date;
  updated_at: string | Date;
}
```

**Enum Types**:
```typescript
export type RoleType = 'superadmin' | 'admin' | 'member';
export type AccountType = 'payroll' | 'savings' | 'cash' | 'investments';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionFrequencyType = 'once' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
export type BudgetType = 'monthly' | 'annually';
export type PlanType = 'premium' | 'free';
```

---

## Database Functions

### PostgreSQL Functions

Supabase supports custom PostgreSQL functions for server-side processing.

#### 1. Get Transactions by User

```sql
CREATE OR REPLACE FUNCTION get_transactions_by_user(
  p_user_id UUID,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_category VARCHAR DEFAULT NULL,
  p_type VARCHAR DEFAULT NULL,
  p_account_id UUID DEFAULT NULL
)
RETURNS SETOF transactions
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM transactions
  WHERE
    user_id = p_user_id
    AND (p_start_date IS NULL OR date >= p_start_date)
    AND (p_end_date IS NULL OR date <= p_end_date)
    AND (p_category IS NULL OR category = p_category)
    AND (p_type IS NULL OR type = p_type)
    AND (p_account_id IS NULL OR account_id = p_account_id)
  ORDER BY date DESC, created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;
```

**TypeScript Usage**:
```typescript
const { data } = await supabaseServer.rpc('get_transactions_by_user', {
  p_user_id: userId,
  p_start_date: '2025-01-01',
  p_end_date: '2025-12-31',
  p_category: 'groceries',
  p_limit: 100
});
```

---

#### 2. Calculate Account Balance

```sql
CREATE OR REPLACE FUNCTION calculate_account_balance(
  p_account_id UUID,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(10, 2)
AS $$
DECLARE
  balance DECIMAL(10, 2) := 0;
BEGIN
  -- Sum income
  SELECT COALESCE(SUM(amount), 0)
  INTO balance
  FROM transactions
  WHERE
    account_id = p_account_id
    AND type = 'income'
    AND date <= p_end_date;

  -- Subtract expenses
  balance := balance - COALESCE((
    SELECT SUM(amount)
    FROM transactions
    WHERE
      account_id = p_account_id
      AND type = 'expense'
      AND date <= p_end_date
  ), 0);

  -- Add transfers in
  balance := balance + COALESCE((
    SELECT SUM(amount)
    FROM transactions
    WHERE
      to_account_id = p_account_id
      AND type = 'transfer'
      AND date <= p_end_date
  ), 0);

  -- Subtract transfers out
  balance := balance - COALESCE((
    SELECT SUM(amount)
    FROM transactions
    WHERE
      account_id = p_account_id
      AND type = 'transfer'
      AND date <= p_end_date
  ), 0);

  RETURN balance;
END;
$$ LANGUAGE plpgsql;
```

**TypeScript Usage**:
```typescript
const { data: balance } = await supabaseServer.rpc('calculate_account_balance', {
  p_account_id: accountId,
  p_end_date: '2025-10-20'
});
```

---

#### 3. Get Monthly Spending by Category

```sql
CREATE OR REPLACE FUNCTION get_monthly_spending_by_category(
  p_user_id UUID,
  p_year INT,
  p_month INT
)
RETURNS TABLE (
  category VARCHAR,
  total_amount DECIMAL(10, 2),
  transaction_count BIGINT
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.category,
    SUM(t.amount) AS total_amount,
    COUNT(*) AS transaction_count
  FROM transactions t
  WHERE
    t.user_id = p_user_id
    AND t.type = 'expense'
    AND EXTRACT(YEAR FROM t.date) = p_year
    AND EXTRACT(MONTH FROM t.date) = p_month
  GROUP BY t.category
  ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql;
```

**TypeScript Usage**:
```typescript
const { data: spending } = await supabaseServer.rpc('get_monthly_spending_by_category', {
  p_user_id: userId,
  p_year: 2025,
  p_month: 10
});
// Returns: [{ category: 'groceries', total_amount: 450.00, transaction_count: 15 }, ...]
```

---

## Row Level Security (RLS)

### RLS Overview

Row Level Security provides data isolation at the database level, ensuring users can only access authorized data.

**Current Implementation**: RLS policies are **not currently enforced** as all operations go through server-validated API routes. However, the infrastructure is in place for future enablement.

### Sample RLS Policies

#### Users Table Policy

```sql
-- Users can only read their own record or users in their group
CREATE POLICY users_select_policy ON users
FOR SELECT
USING (
  id = auth.uid()::text::uuid
  OR group_id IN (
    SELECT group_id FROM users WHERE id = auth.uid()::text::uuid
  )
);

-- Users can only update their own record
CREATE POLICY users_update_policy ON users
FOR UPDATE
USING (id = auth.uid()::text::uuid);
```

---

#### Transactions Table Policy

```sql
-- Users can view transactions they own or from their group
CREATE POLICY transactions_select_policy ON transactions
FOR SELECT
USING (
  user_id = auth.uid()::text::uuid
  OR group_id IN (
    SELECT group_id FROM users WHERE id = auth.uid()::text::uuid
  )
);

-- Users can insert their own transactions
CREATE POLICY transactions_insert_policy ON transactions
FOR INSERT
WITH CHECK (user_id = auth.uid()::text::uuid);

-- Users can update/delete their own transactions
CREATE POLICY transactions_update_policy ON transactions
FOR UPDATE
USING (user_id = auth.uid()::text::uuid);

CREATE POLICY transactions_delete_policy ON transactions
FOR DELETE
USING (user_id = auth.uid()::text::uuid);
```

---

#### Accounts Table Policy

```sql
-- Users can view accounts they have access to or from their group
CREATE POLICY accounts_select_policy ON accounts
FOR SELECT
USING (
  auth.uid()::text::uuid = ANY(user_ids)
  OR group_id IN (
    SELECT group_id FROM users WHERE id = auth.uid()::text::uuid
  )
);
```

### Enabling RLS

To enable RLS on a table:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
-- ...
```

**Note**: Currently disabled as all access goes through server-side API routes with manual validation.

---

## Error Handling

### Error Mapping System

**File**: `lib/api-errors.ts`

### Error Code Enum

```typescript
export enum ErrorCode {
  // Authentication & Authorization
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  USER_NOT_FOUND = 'USER_NOT_FOUND',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_FIELDS = 'MISSING_FIELDS',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Database
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR = 'DB_QUERY_ERROR',
  DB_CONSTRAINT_ERROR = 'DB_CONSTRAINT_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',

  // Business Logic
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',

  // System
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}
```

---

### Supabase Error Mapping

```typescript
export function mapSupabaseError(error: unknown): APIError {
  const supabaseError = error as {
    message?: string;
    code?: string;
    details?: string;
  };

  switch (supabaseError.code) {
    case '23505': // unique_violation
      return new APIError(
        ErrorCode.RESOURCE_CONFLICT,
        'Un elemento con questi dati esiste già.',
        supabaseError.details
      );

    case '23503': // foreign_key_violation
      return new APIError(
        ErrorCode.DB_CONSTRAINT_ERROR,
        'Riferimento a una risorsa inesistente.',
        supabaseError.details
      );

    case '23514': // check_violation
      return new APIError(
        ErrorCode.VALIDATION_ERROR,
        'I dati non rispettano i vincoli di validità.',
        supabaseError.details
      );

    case 'PGRST116': // row not found
      return new APIError(
        ErrorCode.RESOURCE_NOT_FOUND,
        'La risorsa richiesta non esiste.',
        supabaseError.details
      );

    default:
      return new APIError(
        ErrorCode.DB_QUERY_ERROR,
        supabaseError.message || 'Errore durante l\'operazione sul database.',
        supabaseError.details
      );
  }
}
```

**PostgreSQL Error Codes**:
- **23505**: Unique constraint violation (duplicate key)
- **23503**: Foreign key violation (referenced record doesn't exist)
- **23514**: Check constraint violation (invalid value)
- **42P01**: Undefined table
- **42703**: Undefined column
- **PGRST116**: Supabase PostgREST row not found

---

### APIError Class

```typescript
export class APIError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;
  public readonly timestamp: string;

  constructor(
    code: ErrorCode,
    message?: string,
    details?: unknown
  ) {
    super(message || ERROR_MESSAGES[code]);
    this.code = code;
    this.statusCode = ERROR_STATUS_CODES[code];
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toResponse(): NextResponse {
    return NextResponse.json({
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp,
      }
    }, { status: this.statusCode });
  }
}
```

**Usage in API Routes**:
```typescript
try {
  const data = handleServerResponse(
    await supabaseServer.from('transactions').select('*').eq('id', id).single()
  );
  return NextResponse.json({ data });
} catch (error) {
  const apiError = handleError(error);
  return apiError.toResponse();
}
```

---

## Data Access Patterns

### Pattern 1: Server-Side CRUD

**All write operations** go through Next.js API routes with server-side validation.

**Example: Create Transaction**

```typescript
// API Route: app/api/transactions/route.ts
export async function POST(request: Request) {
  try {
    // 1. Validate user context
    const { userId, group_id } = await validateUserContext();

    // 2. Parse request body
    const body = await request.json();

    // 3. Validate data (optional, can use Zod)
    if (!body.amount || !body.description) {
      throw createMissingFieldError(['amount', 'description']);
    }

    // 4. Insert to database
    const response = await supabaseServer
      .from('transactions')
      .insert({
        ...body,
        user_id: userId,
        group_id: group_id,
      })
      .select()
      .single();

    // 5. Handle response
    const transaction = handleServerResponse(response);

    return NextResponse.json({ data: transaction });
  } catch (error) {
    const apiError = handleError(error);
    return apiError.toResponse();
  }
}
```

---

### Pattern 2: Client-Side Reads

**Simple reads** can use browser client (with RLS protection).

```typescript
// Component or Hook
import { supabase } from '@/lib/supabase-client';

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('label', { ascending: true });

  if (error) throw error;
  return data;
}
```

**Note**: For most operations, prefer server-side reads through API routes for better caching and security.

---

### Pattern 3: Complex Queries with Joins

**Server-side only** for complex joins and aggregations.

```typescript
// Get transactions with user and account details
const { data } = await supabaseServer
  .from('transactions')
  .select(`
    *,
    user:users!user_id(name, email),
    account:accounts!account_id(name, type)
  `)
  .eq('user_id', userId)
  .order('date', { ascending: false })
  .limit(50);
```

---

### Pattern 4: Filtered Queries

**Use query helpers** for consistent filtering.

```typescript
import { applyPagination, applyDateFilter } from '@/lib/supabase-server';

let query = supabaseServer
  .from('transactions')
  .select('*')
  .eq('user_id', userId);

// Apply date filter
query = applyDateFilter(query, {
  startDate: '2025-01-01',
  endDate: '2025-12-31',
});

// Apply pagination
query = applyPagination(query, {
  page: 1,
  limit: 20,
  sortBy: 'date',
  sortOrder: 'desc',
});

const { data } = await query;
```

---

## Query Helpers

### Query Key Management

**File**: `lib/query-keys.ts`

```typescript
export const queryKeys = {
  // Users
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
  userByClerkId: (clerkId: string) => ['users', 'clerk', clerkId] as const,

  // Transactions
  transactions: ['transactions'] as const,
  transaction: (id: string) => ['transactions', id] as const,
  transactionsByUser: (userId: string) => ['transactions', 'user', userId] as const,
  transactionsByAccount: (accountId: string) => ['transactions', 'account', accountId] as const,

  // Budgets
  budgets: ['budgets'] as const,
  budget: (id: string) => ['budgets', id] as const,
  budgetsByUser: (userId: string) => ['budgets', 'user', userId] as const,

  // Categories
  categories: ['categories'] as const,
  category: (id: string) => ['categories', id] as const,

  // Accounts
  accounts: ['accounts'] as const,
  account: (id: string) => ['accounts', id] as const,

  // Recurring
  recurringSeries: ['recurring-series'] as const,
  recurringSeriesById: (id: string) => ['recurring-series', id] as const,
};
```

**Usage**:
```typescript
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

const { data: transactions } = useQuery({
  queryKey: queryKeys.transactionsByUser(userId),
  queryFn: () => transactionService.getByUserId(userId),
  staleTime: 60000, // 1 minute
});
```

---

### Cache Update Utilities

**File**: `lib/query-cache-utils.ts`

```typescript
export function updateTransactionCache(
  queryClient: QueryClient,
  transaction: Transaction
) {
  // Update transactions list
  queryClient.setQueryData(
    queryKeys.transactions,
    (old: Transaction[] = []) => {
      const index = old.findIndex(t => t.id === transaction.id);
      if (index >= 0) {
        const updated = [...old];
        updated[index] = transaction;
        return updated;
      }
      return [transaction, ...old];
    }
  );

  // Update single transaction cache
  queryClient.setQueryData(
    queryKeys.transaction(transaction.id),
    transaction
  );

  // Update user-specific list
  queryClient.setQueryData(
    queryKeys.transactionsByUser(transaction.user_id),
    (old: Transaction[] = []) => {
      const index = old.findIndex(t => t.id === transaction.id);
      if (index >= 0) {
        const updated = [...old];
        updated[index] = transaction;
        return updated;
      }
      return [transaction, ...old];
    }
  );
}
```

**Optimistic Updates**:
```typescript
const mutation = useMutation({
  mutationFn: (data) => transactionService.create(data),
  onMutate: async (newTransaction) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: queryKeys.transactions });

    // Snapshot previous value
    const previous = queryClient.getQueryData(queryKeys.transactions);

    // Optimistically update
    queryClient.setQueryData(queryKeys.transactions, (old: Transaction[]) => [
      { ...newTransaction, id: 'temp-' + Date.now() },
      ...old
    ]);

    return { previous };
  },
  onError: (err, newTransaction, context) => {
    // Rollback on error
    if (context?.previous) {
      queryClient.setQueryData(queryKeys.transactions, context.previous);
    }
  },
  onSuccess: (data) => {
    // Update cache with real data
    updateTransactionCache(queryClient, data);
  },
});
```

---

## Environment Configuration

### Required Environment Variables

**File**: `.env.example`

```bash
# Authentication - Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Getting Supabase Credentials

1. **Create Supabase Project**: https://supabase.com
2. **Get URL**: Project Settings → API → Project URL
3. **Get Anon Key**: Project Settings → API → Project API keys → `anon` `public`
4. **Get Service Role Key**: Project Settings → API → Project API keys → `service_role` (keep secret!)

### Security Notes

- **Never commit** `.env` file to version control
- **Service role key** bypasses RLS - use only server-side
- **Anon key** is safe to expose client-side (protected by RLS)
- **Clerk keys** link authentication to database users

---

## Best Practices

### 1. Always Use Server-Side for Writes

✅ **Good**:
```typescript
// API Route
export async function POST(request: Request) {
  const { userId } = await validateUserContext();
  const data = await supabaseServer.from('transactions').insert({ ... });
}
```

❌ **Bad**:
```typescript
// Client component
const createTransaction = async () => {
  await supabase.from('transactions').insert({ ... }); // No validation!
};
```

---

### 2. Use Type-Safe Queries

✅ **Good**:
```typescript
import type { Database } from '@/lib/database.types';

const supabase = createClient<Database>(url, key);
const { data } = await supabase.from('users').select('*');
// data is typed as Database['public']['Tables']['users']['Row'][]
```

❌ **Bad**:
```typescript
const { data } = await supabase.from('users').select('*');
// data is any
```

---

### 3. Handle Errors Gracefully

✅ **Good**:
```typescript
try {
  const user = handleServerResponse(
    await supabaseServer.from('users').select('*').eq('id', id).single()
  );
  return NextResponse.json({ data: user });
} catch (error) {
  const apiError = handleError(error);
  return apiError.toResponse(); // Structured error with Italian message
}
```

❌ **Bad**:
```typescript
const { data, error } = await supabase.from('users').select('*');
if (error) throw error; // Raw Supabase error, no user-friendly message
```

---

### 4. Use Query Keys Consistently

✅ **Good**:
```typescript
import { queryKeys } from '@/lib/query-keys';

const { data } = useQuery({
  queryKey: queryKeys.transactionsByUser(userId),
  queryFn: () => transactionService.getByUserId(userId),
});

// Later, invalidate the same key
queryClient.invalidateQueries({ queryKey: queryKeys.transactionsByUser(userId) });
```

❌ **Bad**:
```typescript
const { data } = useQuery({
  queryKey: ['transactions', userId], // Inconsistent structure
});

queryClient.invalidateQueries({ queryKey: ['user-transactions', userId] }); // Doesn't match!
```

---

### 5. Validate Resource Access

✅ **Good**:
```typescript
const hasAccess = await validateResourceAccess(
  userId,
  'transaction',
  transactionId
);

if (!hasAccess) {
  throw new APIError(ErrorCode.PERMISSION_DENIED);
}
```

❌ **Bad**:
```typescript
// Assume user has access without checking
const { data } = await supabaseServer.from('transactions').select('*').eq('id', id);
```

---

### 6. Use Indexes for Common Queries

✅ **Good**:
```sql
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
```

**Query**:
```sql
SELECT * FROM transactions
WHERE user_id = '...'
ORDER BY date DESC;
-- Uses index for fast lookup
```

---

### 7. Batch Operations When Possible

✅ **Good**:
```typescript
const { data } = await supabaseServer
  .from('transactions')
  .insert([
    { description: 'Transaction 1', amount: 100, ... },
    { description: 'Transaction 2', amount: 200, ... },
    { description: 'Transaction 3', amount: 300, ... },
  ]);
// Single database round trip
```

❌ **Bad**:
```typescript
for (const tx of transactions) {
  await supabaseServer.from('transactions').insert(tx);
}
// N database round trips
```

---

### 8. Use Database Functions for Complex Logic

✅ **Good**:
```typescript
// Database function handles complex calculation
const { data: balance } = await supabaseServer.rpc('calculate_account_balance', {
  p_account_id: accountId,
});
```

❌ **Bad**:
```typescript
// Fetch all transactions and calculate in JS
const { data: transactions } = await supabaseServer
  .from('transactions')
  .select('*')
  .eq('account_id', accountId);

const balance = transactions.reduce((sum, tx) => {
  // ... complex logic in application code
}, 0);
```

---

### 9. Cache Reference Data Aggressively

✅ **Good**:
```typescript
const { data: categories } = useQuery({
  queryKey: queryKeys.categories,
  queryFn: () => categoryService.getAll(),
  staleTime: 10 * 60 * 1000, // 10 minutes - categories rarely change
});
```

---

### 10. Use Transactions for Related Operations

✅ **Good** (when available):
```sql
BEGIN;
  INSERT INTO transactions (description, amount, ...) VALUES (...);
  UPDATE accounts SET balance = balance - amount WHERE id = account_id;
COMMIT;
```

**Note**: Supabase client doesn't support explicit transactions. Use database functions for atomic operations.

---

## Migration Strategy

### Current State

- No formal migration system in place
- Schema managed manually in Supabase dashboard
- Type generation via Supabase CLI

### Recommended Future Setup

1. **Install Supabase CLI**:
```bash
npm install -g supabase
supabase init
```

2. **Create Migration**:
```bash
supabase migration new add_investment_holdings_table
```

3. **Write Migration** (supabase/migrations/xxx_add_investment_holdings_table.sql):
```sql
CREATE TABLE investment_holdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  name VARCHAR(255) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  quantity DECIMAL(10, 4) NOT NULL,
  purchase_price DECIMAL(10, 2) NOT NULL,
  current_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_investment_holdings_user_id ON investment_holdings(user_id);
```

4. **Apply Migration**:
```bash
supabase db push
```

5. **Generate Types**:
```bash
supabase gen types typescript --project-id your-project-id > lib/database.types.ts
```

---

## Performance Considerations

### Query Optimization

1. **Use Indexes**: All foreign keys and frequently filtered columns have indexes
2. **Limit Results**: Always use `.limit()` for list queries
3. **Select Specific Columns**: Use `.select('id, name, email')` instead of `.select('*')` when possible
4. **Avoid N+1 Queries**: Use joins or batch fetches

### Caching Strategy

- **Reference Data** (categories): 10-minute staleTime
- **User Data** (users, accounts): 5-minute staleTime
- **Financial Data** (transactions, budgets): 1-2 minute staleTime
- **Computed Data** (balances, analytics): 1-minute staleTime

### Connection Pooling

Supabase handles connection pooling automatically. No configuration needed.

---

## Troubleshooting

### Common Issues

#### 1. "Missing environment variables"

**Solution**: Ensure `.env` file contains all required Supabase variables.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

---

#### 2. "JWT expired" or "Invalid auth token"

**Solution**: Refresh Clerk session or re-authenticate user.

```typescript
const { userId } = await auth();
if (!userId) {
  redirect('/sign-in');
}
```

---

#### 3. "Foreign key violation"

**Cause**: Trying to insert a record that references a non-existent parent record.

**Solution**: Ensure referenced records exist before inserting.

```typescript
// Check user exists before creating transaction
const userExists = await supabaseServer
  .from('users')
  .select('id')
  .eq('id', userId)
  .single();

if (!userExists.data) {
  throw new APIError(ErrorCode.USER_NOT_FOUND);
}
```

---

#### 4. "Unique constraint violation"

**Cause**: Trying to insert a duplicate value for a unique field (e.g., email).

**Solution**: Check for existing record before inserting.

```typescript
const existing = await supabaseServer
  .from('users')
  .select('id')
  .eq('email', email)
  .maybeSingle();

if (existing.data) {
  throw new APIError(ErrorCode.RESOURCE_CONFLICT, 'Email already in use');
}
```

---

#### 5. "Row not found" (PGRST116)

**Cause**: Querying with `.single()` but no matching record exists.

**Solution**: Use `.maybeSingle()` or handle null data.

```typescript
const { data, error } = await supabaseServer
  .from('users')
  .select('*')
  .eq('id', userId)
  .maybeSingle(); // Returns null instead of error

if (!data) {
  throw new APIError(ErrorCode.USER_NOT_FOUND);
}
```

---

## Related Documentation

- **[API.md](./API.md)** - API client and service layer documentation
- **[BACKEND.md](./BACKEND.md)** - Business logic and utilities
- **[HOOKS.md](./HOOKS.md)** - React hooks for data fetching
- **[UI-SYSTEM.md](./UI-SYSTEM.md)** - UI components and design system

---

**Production Ready** ✅
**Version**: 1.0
**Last Updated**: October 20, 2025
