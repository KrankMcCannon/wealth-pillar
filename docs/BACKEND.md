# Backend Services Documentation

**Version**: 1.0
**Last Updated**: October 2025
**Status**: ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Business Services](#business-services)
3. [View Models](#view-models)
4. [Utility Functions](#utility-functions)
5. [Query Utilities](#query-utilities)
6. [Best Practices](#best-practices)

---

## Overview

### Service Layer Architecture

Wealth Pillar uses a **pure function service layer** for business logic:

```
┌─────────────────────────────────────────┐
│  Components / Pages                     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Controller Hooks                       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Business Services                      │
│  - transaction-filtering.service.ts     │
│  - financial-calculations.service.ts    │
│  - data-grouping.service.ts            │
│  - chart-data.service.ts               │
│  - form-validation.service.ts          │
│  - form-state.service.ts               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  View Models                            │
│  - transactions-view-model.ts          │
│  - budgets-view-model.ts               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Utility Functions                      │
│  - lib/utils.ts                        │
│  - lib/budget-calculations.ts          │
│  - lib/role-based-filters.ts           │
└─────────────────────────────────────────┘
```

### Design Principles

1. **Pure Functions** - No side effects, predictable outputs
2. **Single Responsibility** - One service per concern
3. **No React Dependencies** - Testable in isolation
4. **Type Safety** - Full TypeScript coverage
5. **Performance** - O(n) algorithms, avoid O(n²)

---

## Business Services

### transaction-filtering.service.ts

**Purpose**: Filter transactions with O(n) single-pass algorithm

**Location**: `lib/services/transaction-filtering.service.ts`

#### filterTransactions()

Filter transactions by multiple criteria in a single pass.

```typescript
export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters
): Transaction[] {
  return transactions.filter((tx) => {
    // Type filter
    if (filters.type && filters.type !== 'all' && tx.type !== filters.type) {
      return false;
    }

    // Category filter
    if (filters.category && filters.category !== 'all' && tx.category !== filters.category) {
      return false;
    }

    // Date range filter
    if (filters.from && tx.date < filters.from) {
      return false;
    }
    if (filters.to && tx.date > filters.to) {
      return false;
    }

    // Account filter
    if (filters.accountId && tx.account_id !== filters.accountId) {
      return false;
    }

    // User filter
    if (filters.userId && filters.userId !== 'all' && tx.user_id !== filters.userId) {
      return false;
    }

    // Search filter (description)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!tx.description.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    return true;
  });
}
```

**Parameters**:
- `transactions: Transaction[]` - Array to filter
- `filters: TransactionFilters` - Filter criteria

**Returns**: `Transaction[]` - Filtered array

**Performance**: O(n) - Single pass through array

**Usage**:
```typescript
const filtered = filterTransactions(allTransactions, {
  type: 'expense',
  category: 'food',
  from: '2025-01-01',
  to: '2025-01-31',
  search: 'grocery'
});
```

---

#### filterByBudgetScope()

Filter transactions that fall within a budget's scope.

```typescript
export function filterByBudgetScope(
  transactions: Transaction[],
  budget: Budget
): Transaction[] {
  return transactions.filter((tx) => {
    // Must match budget users
    if (!budget.user_ids.includes(tx.user_id)) {
      return false;
    }

    // Must match budget categories
    if (!budget.categories.includes(tx.category)) {
      return false;
    }

    // Must be expense type
    if (tx.type !== 'expense') {
      return false;
    }

    // Must be in budget period
    if (budget.period_start && tx.date < budget.period_start) {
      return false;
    }
    if (budget.period_end && tx.date > budget.period_end) {
      return false;
    }

    return true;
  });
}
```

**Parameters**:
- `transactions: Transaction[]` - All transactions
- `budget: Budget` - Budget to match against

**Returns**: `Transaction[]` - Transactions within budget scope

---

#### filterByRole()

Filter resources based on user role (admin vs. member).

```typescript
export function filterByRole<T extends { user_id: string }>(
  items: T[],
  currentUserId: string,
  userRole: 'admin' | 'member' | 'superadmin'
): T[] {
  if (userRole === 'admin' || userRole === 'superadmin') {
    // Admins see everything
    return items;
  }

  // Members only see their own items
  return items.filter((item) => item.user_id === currentUserId);
}
```

**Parameters**:
- `items: T[]` - Resources to filter
- `currentUserId: string` - Current user ID
- `userRole: string` - User's role

**Returns**: `T[]` - Filtered resources

---

### data-grouping.service.ts

**Purpose**: Group and aggregate data with O(n) Map-based algorithms

**Location**: `lib/services/data-grouping.service.ts`

#### groupTransactionsByDay()

Group transactions by day with daily totals.

```typescript
export function groupTransactionsByDay(
  transactions: Transaction[]
): GroupedTransactions[] {
  const groups = new Map<string, Transaction[]>();

  // Group by date (O(n))
  for (const tx of transactions) {
    const dateKey = tx.date;
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(tx);
  }

  // Convert to array and calculate totals
  const result: GroupedTransactions[] = [];
  for (const [date, txs] of groups.entries()) {
    const totalIncome = txs
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = txs
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    result.push({
      date,
      dateLabel: formatDateLabel(date),
      transactions: txs.sort((a, b) => b.created_at.localeCompare(a.created_at)),
      totalIncome,
      totalExpense,
      netAmount: totalIncome - totalExpense,
    });
  }

  // Sort by date descending
  return result.sort((a, b) => b.date.localeCompare(a.date));
}
```

**Parameters**:
- `transactions: Transaction[]` - Transactions to group

**Returns**:
```typescript
interface GroupedTransactions {
  date: string;
  dateLabel: string;
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
}
```

**Performance**: O(n) - Single pass with Map

---

#### groupBudgetsByUser()

Group budgets by user ID.

```typescript
export function groupBudgetsByUser(
  budgets: Budget[]
): Map<string, Budget[]> {
  const groups = new Map<string, Budget[]>();

  for (const budget of budgets) {
    for (const userId of budget.user_ids) {
      if (!groups.has(userId)) {
        groups.set(userId, []);
      }
      groups.get(userId)!.push(budget);
    }
  }

  return groups;
}
```

**Parameters**:
- `budgets: Budget[]` - Budgets to group

**Returns**: `Map<string, Budget[]>` - Grouped by user ID

---

#### groupTransactionsByCategory()

Group transactions by category with totals.

```typescript
export function groupTransactionsByCategory(
  transactions: Transaction[]
): CategoryGroup[] {
  const groups = new Map<string, { transactions: Transaction[]; total: number }>();

  for (const tx of transactions) {
    if (!groups.has(tx.category)) {
      groups.set(tx.category, { transactions: [], total: 0 });
    }
    const group = groups.get(tx.category)!;
    group.transactions.push(tx);
    group.total += tx.amount;
  }

  return Array.from(groups.entries()).map(([category, data]) => ({
    category,
    transactions: data.transactions,
    total: data.total,
    count: data.transactions.length,
  }));
}
```

**Returns**:
```typescript
interface CategoryGroup {
  category: string;
  transactions: Transaction[];
  total: number;
  count: number;
}
```

---

### financial-calculations.service.ts

**Purpose**: Financial calculations and metrics

**Location**: `lib/services/financial-calculations.service.ts`

#### calculateAccountBalances()

Calculate current balance for each account.

```typescript
export function calculateAccountBalances(
  accounts: Account[],
  transactions: Transaction[]
): Record<string, number> {
  const balances: Record<string, number> = {};

  // Initialize balances
  for (const account of accounts) {
    balances[account.id] = 0;
  }

  // Apply transactions
  for (const tx of transactions) {
    if (tx.type === 'income') {
      balances[tx.account_id] += tx.amount;
    } else if (tx.type === 'expense') {
      balances[tx.account_id] -= tx.amount;
    } else if (tx.type === 'transfer' && tx.to_account_id) {
      balances[tx.account_id] -= tx.amount;
      balances[tx.to_account_id] += tx.amount;
    }
  }

  return balances;
}
```

**Parameters**:
- `accounts: Account[]` - All accounts
- `transactions: Transaction[]` - All transactions

**Returns**: `Record<string, number>` - Balance per account ID

---

#### calculateBudgetProgress()

Calculate budget spending and progress.

```typescript
export function calculateBudgetProgress(
  budget: Budget,
  transactions: Transaction[]
): BudgetProgress {
  // Filter transactions in budget scope
  const budgetTransactions = filterByBudgetScope(transactions, budget);

  // Calculate spent amount
  const spent = budgetTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  // Calculate remaining and progress
  const remaining = budget.amount - spent;
  const progress = (spent / budget.amount) * 100;

  // Determine status
  let status: 'on-track' | 'warning' | 'exceeded';
  if (progress >= 100) {
    status = 'exceeded';
  } else if (progress >= 80) {
    status = 'warning';
  } else {
    status = 'on-track';
  }

  return {
    budgetId: budget.id,
    spent,
    remaining,
    progress,
    status,
    transactionCount: budgetTransactions.length,
  };
}
```

**Returns**:
```typescript
interface BudgetProgress {
  budgetId: string;
  spent: number;
  remaining: number;
  progress: number; // 0-100
  status: 'on-track' | 'warning' | 'exceeded';
  transactionCount: number;
}
```

---

#### calculatePortfolioMetrics()

Calculate investment portfolio metrics.

```typescript
export function calculatePortfolioMetrics(
  holdings: InvestmentHolding[]
): PortfolioMetrics {
  const totalValue = holdings.reduce((sum, h) => sum + h.current_value, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.cost_basis, 0);
  const totalGain = totalValue - totalCost;
  const totalGainPercent = (totalGain / totalCost) * 100;

  return {
    totalValue,
    totalCost,
    totalGain,
    totalGainPercent,
    holdingsCount: holdings.length,
  };
}
```

**Returns**:
```typescript
interface PortfolioMetrics {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  holdingsCount: number;
}
```

---

#### calculateMonthlyFinancials()

Calculate monthly income, expenses, and savings rate.

```typescript
export function calculateMonthlyFinancials(
  transactions: Transaction[],
  month: string // YYYY-MM
): MonthlyFinancials {
  const monthTransactions = transactions.filter((tx) =>
    tx.date.startsWith(month)
  );

  const totalIncome = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netIncome = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

  return {
    month,
    totalIncome,
    totalExpenses,
    netIncome,
    savingsRate,
    transactionCount: monthTransactions.length,
  };
}
```

**Returns**:
```typescript
interface MonthlyFinancials {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  savingsRate: number;
  transactionCount: number;
}
```

---

### chart-data.service.ts

**Purpose**: Prepare data for chart visualization (Revolut-style)

**Location**: `lib/services/chart-data.service.ts`

#### prepareLineChartData()

Prepare time-series data for line charts.

```typescript
export function prepareLineChartData(
  transactions: Transaction[],
  startDate: string,
  endDate: string,
  interval: 'day' | 'week' | 'month'
): LineChartData[] {
  const data: LineChartData[] = [];
  const groups = groupByInterval(transactions, interval);

  for (const [date, txs] of groups.entries()) {
    const income = txs
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = txs
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    data.push({
      date,
      dateLabel: formatChartDate(date, interval),
      income,
      expenses,
      net: income - expenses,
    });
  }

  // Sort by date
  return data.sort((a, b) => a.date.localeCompare(b.date));
}
```

**Parameters**:
- `transactions: Transaction[]` - Transaction data
- `startDate: string` - Start date (YYYY-MM-DD)
- `endDate: string` - End date (YYYY-MM-DD)
- `interval: string` - Grouping interval

**Returns**:
```typescript
interface LineChartData {
  date: string;
  dateLabel: string;
  income: number;
  expenses: number;
  net: number;
}
```

---

#### prepareCategoryChartData()

Prepare category breakdown for pie/bar charts.

```typescript
export function prepareCategoryChartData(
  transactions: Transaction[],
  categories: Category[]
): CategoryChartData[] {
  const categoryMap = new Map<string, number>();

  // Sum by category
  for (const tx of transactions) {
    if (tx.type === 'expense') {
      const current = categoryMap.get(tx.category) || 0;
      categoryMap.set(tx.category, current + tx.amount);
    }
  }

  // Create chart data with labels
  const data: CategoryChartData[] = [];
  for (const [categoryKey, amount] of categoryMap.entries()) {
    const category = categories.find((c) => c.key === categoryKey);
    data.push({
      categoryKey,
      categoryLabel: category?.label || categoryKey,
      categoryIcon: category?.icon || '📊',
      categoryColor: category?.color || '#888',
      amount,
      percentage: 0, // Calculated below
    });
  }

  // Calculate percentages
  const total = data.reduce((sum, d) => sum + d.amount, 0);
  for (const item of data) {
    item.percentage = (item.amount / total) * 100;
  }

  // Sort by amount descending
  return data.sort((a, b) => b.amount - a.amount);
}
```

**Returns**:
```typescript
interface CategoryChartData {
  categoryKey: string;
  categoryLabel: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  percentage: number;
}
```

---

#### prepareDailyExpenseData()

Prepare daily expense data for budget tracking charts.

```typescript
export function prepareDailyExpenseData(
  transactions: Transaction[],
  budget: Budget
): DailyExpenseData[] {
  const dailyMap = new Map<string, number>();
  const budgetTxs = filterByBudgetScope(transactions, budget);

  // Sum by day
  for (const tx of budgetTxs) {
    const current = dailyMap.get(tx.date) || 0;
    dailyMap.set(tx.date, current + tx.amount);
  }

  // Create array with running total
  const data: DailyExpenseData[] = [];
  let runningTotal = 0;

  const sortedDates = Array.from(dailyMap.keys()).sort();
  for (const date of sortedDates) {
    const dayAmount = dailyMap.get(date)!;
    runningTotal += dayAmount;

    data.push({
      date,
      dateLabel: formatDateLabel(date),
      dayAmount,
      runningTotal,
      budgetLimit: budget.amount,
      percentOfBudget: (runningTotal / budget.amount) * 100,
    });
  }

  return data;
}
```

**Returns**:
```typescript
interface DailyExpenseData {
  date: string;
  dateLabel: string;
  dayAmount: number;
  runningTotal: number;
  budgetLimit: number;
  percentOfBudget: number;
}
```

---

### form-validation.service.ts

**Purpose**: Validation rules and schemas

**Location**: `lib/services/form-validation.service.ts`

#### Validation Rules

```typescript
export const rules = {
  required: (message = 'Campo obbligatorio') => (value: any) => {
    if (value === null || value === undefined || value === '') {
      return message;
    }
    return null;
  },

  minLength: (min: number, message?: string) => (value: string) => {
    if (value && value.length < min) {
      return message || `Minimo ${min} caratteri`;
    }
    return null;
  },

  maxLength: (max: number, message?: string) => (value: string) => {
    if (value && value.length > max) {
      return message || `Massimo ${max} caratteri`;
    }
    return null;
  },

  positiveAmount: (message = 'Importo deve essere positivo') => (value: number) => {
    if (value !== null && value !== undefined && value <= 0) {
      return message;
    }
    return null;
  },

  validDate: (message = 'Data non valida') => (value: string) => {
    if (value && !isValidDateString(value)) {
      return message;
    }
    return null;
  },

  dateNotInFuture: (message = 'Data non può essere futura') => (value: string) => {
    if (value && new Date(value) > new Date()) {
      return message;
    }
    return null;
  },

  email: (message = 'Email non valida') => (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return message;
    }
    return null;
  },

  pattern: (regex: RegExp, message = 'Formato non valido') => (value: string) => {
    if (value && !regex.test(value)) {
      return message;
    }
    return null;
  },

  arrayNotEmpty: (message = 'Seleziona almeno un elemento') => (value: any[]) => {
    if (!value || value.length === 0) {
      return message;
    }
    return null;
  },

  conditional: (condition: () => boolean, validator: ValidatorFn) => (value: any) => {
    if (condition()) {
      return validator(value);
    }
    return null;
  },
};
```

#### Validation Schemas

```typescript
export const transactionValidationSchema = {
  user_id: [rules.required('Seleziona un utente')],
  account_id: [rules.required('Seleziona un conto')],
  amount: [rules.required('Inserisci un importo'), rules.positiveAmount()],
  date: [rules.required('Seleziona una data'), rules.validDate()],
  description: [rules.required('Inserisci una descrizione'), rules.minLength(2)],
  category: [rules.required('Seleziona una categoria')],
  type: [rules.required('Seleziona un tipo')],
};

export const budgetValidationSchema = {
  description: [rules.required(), rules.minLength(2)],
  amount: [rules.required(), rules.positiveAmount()],
  period_id: [rules.required('Seleziona un periodo')],
  categories: [rules.arrayNotEmpty('Seleziona almeno una categoria')],
  user_ids: [rules.arrayNotEmpty('Seleziona almeno un utente')],
};

export const categoryValidationSchema = {
  key: [rules.required(), rules.minLength(2), rules.pattern(/^[a-z-]+$/, 'Solo minuscole e trattini')],
  label: [rules.required(), rules.minLength(2)],
  icon: [rules.required('Seleziona un\'icona')],
  color: [rules.required('Seleziona un colore')],
};

export const recurringSeriesValidationSchema = {
  description: [rules.required(), rules.minLength(2)],
  amount: [rules.required(), rules.positiveAmount()],
  type: [rules.required()],
  category: [rules.required()],
  frequency: [rules.required()],
  due_date: [rules.required(), rules.validDate()],
  user_id: [rules.required()],
  account_id: [rules.required()],
};
```

#### Validation Functions

```typescript
export function validateField(value: any, validators: ValidatorFn[]): string | null {
  for (const validator of validators) {
    const error = validator(value);
    if (error) return error;
  }
  return null;
}

export function validateForm<T extends Record<string, any>>(
  formState: T,
  schema: Record<keyof T, ValidatorFn[]>
): Record<keyof T, string> {
  const errors: Partial<Record<keyof T, string>> = {};

  for (const key in schema) {
    const error = validateField(formState[key], schema[key]);
    if (error) {
      errors[key] = error;
    }
  }

  return errors as Record<keyof T, string>;
}

export function validateFieldByName(
  fieldName: string,
  value: any,
  schema: Record<string, ValidatorFn[]>
): string | null {
  const validators = schema[fieldName];
  if (!validators) return null;
  return validateField(value, validators);
}
```

---

### form-state.service.ts

**Purpose**: Immutable form state management

**Location**: `lib/services/form-state.service.ts`

#### State Management

```typescript
export function createFormState<T>(
  initialValues: Partial<T>,
  defaults: T
): T {
  return { ...defaults, ...initialValues };
}

export function updateFormField<T>(
  state: T,
  field: keyof T,
  value: any
): T {
  return { ...state, [field]: value };
}

export function updateFormFields<T>(
  state: T,
  updates: Partial<T>
): T {
  return { ...state, ...updates };
}

export function resetFormState<T>(defaults: T): T {
  return { ...defaults };
}
```

#### Dirty Checking

```typescript
export function isDirty<T>(
  current: T,
  initial: T
): boolean {
  return JSON.stringify(current) !== JSON.stringify(initial);
}

export function getDirtyFields<T>(
  current: T,
  initial: T
): (keyof T)[] {
  const dirtyFields: (keyof T)[] = [];

  for (const key in current) {
    if (current[key] !== initial[key]) {
      dirtyFields.push(key);
    }
  }

  return dirtyFields;
}
```

#### Transformation Utilities

```typescript
export function prefillUserDefaults<T>(
  formState: T & { user_id?: string },
  user: User
): T {
  return {
    ...formState,
    user_id: formState.user_id || user.id,
  };
}

export function prefillDefaultAccount<T>(
  formState: T & { account_id?: string },
  user: User,
  accounts: Account[]
): T {
  if (formState.account_id) return formState;

  const userAccounts = accounts.filter((a) => a.user_ids.includes(user.id));
  const defaultAccount = userAccounts[0];

  return {
    ...formState,
    account_id: defaultAccount?.id || '',
  };
}

export function prefillTodayDate<T>(
  formState: T & { date?: string }
): T {
  return {
    ...formState,
    date: formState.date || getTodayString(),
  };
}

export function sanitizeFormState<T>(formState: T): T {
  const sanitized = { ...formState };

  // Remove empty strings
  for (const key in sanitized) {
    if (sanitized[key] === '') {
      delete sanitized[key];
    }
  }

  return sanitized;
}

export function formStateToPayload<T>(formState: T): T {
  // Remove UI-only fields, trim strings, etc.
  const payload = { ...formState };

  for (const key in payload) {
    const value = payload[key];
    if (typeof value === 'string') {
      payload[key] = value.trim() as any;
    }
  }

  return payload;
}
```

---

## View Models

### transactions-view-model.ts

**Purpose**: Transform transaction data for UI consumption

**Location**: `lib/view-models/transactions-view-model.ts`

```typescript
export interface TransactionsViewModel {
  groupedTransactions: GroupedTransactions[];
  categories: Category[];
  accounts: Account[];
  accountNames: Record<string, string>;
  categoryLabels: Record<string, string>;
  recurringSeries: RecurringTransactionSeries[];
  filterCounts: {
    total: number;
    income: number;
    expense: number;
    transfer: number;
  };
}

export function createTransactionsViewModel(
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[],
  recurringSeries: RecurringTransactionSeries[]
): TransactionsViewModel {
  // Group transactions by day
  const groupedTransactions = groupTransactionsByDay(transactions);

  // Create lookup maps
  const accountNames = Object.fromEntries(
    accounts.map((a) => [a.id, a.name])
  );

  const categoryLabels = Object.fromEntries(
    categories.map((c) => [c.key, c.label])
  );

  // Calculate filter counts
  const filterCounts = {
    total: transactions.length,
    income: transactions.filter((t) => t.type === 'income').length,
    expense: transactions.filter((t) => t.type === 'expense').length,
    transfer: transactions.filter((t) => t.type === 'transfer').length,
  };

  return {
    groupedTransactions,
    categories,
    accounts,
    accountNames,
    categoryLabels,
    recurringSeries,
    filterCounts,
  };
}
```

---

### budgets-view-model.ts

**Purpose**: Transform budget data with progress calculations

**Location**: `lib/view-models/budgets-view-model.ts`

```typescript
export interface BudgetsViewModel {
  budgetsWithProgress: BudgetWithProgress[];
  currentPeriod: BudgetPeriod | null;
  availablePeriods: BudgetPeriod[];
  totalBudgeted: number;
  totalSpent: number;
  overallProgress: number;
}

export function createBudgetsViewModel(
  budgets: Budget[],
  transactions: Transaction[],
  currentPeriod: BudgetPeriod | null,
  periods: BudgetPeriod[]
): BudgetsViewModel {
  // Calculate progress for each budget
  const budgetsWithProgress = budgets.map((budget) => ({
    ...budget,
    progress: calculateBudgetProgress(budget, transactions),
  }));

  // Calculate totals
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgetsWithProgress.reduce(
    (sum, b) => sum + b.progress.spent,
    0
  );
  const overallProgress = (totalSpent / totalBudgeted) * 100;

  return {
    budgetsWithProgress,
    currentPeriod,
    availablePeriods: periods,
    totalBudgeted,
    totalSpent,
    overallProgress,
  };
}
```

---

## Utility Functions

### lib/utils.ts

**Purpose**: General utility functions

**Key Functions**:

```typescript
// Currency formatting (IT locale)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

// Date formatting
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('it-IT');
}

// Category label lookup
export function getCategoryLabel(categoryKey: string, categories: Category[]): string {
  const category = categories.find((c) => c.key === categoryKey);
  return category?.label || categoryKey;
}

// Text truncation
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// Class name merging (for Tailwind)
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

---

### lib/budget-calculations.ts

**Purpose**: Budget-specific calculations

```typescript
export function calculateBudgetSpent(
  budget: Budget,
  transactions: Transaction[]
): number {
  const budgetTxs = filterByBudgetScope(transactions, budget);
  return budgetTxs.reduce((sum, tx) => sum + tx.amount, 0);
}

export function calculateBudgetRemaining(
  budget: Budget,
  transactions: Transaction[]
): number {
  const spent = calculateBudgetSpent(budget, transactions);
  return budget.amount - spent;
}

export function calculateDailyBudgetLimit(
  budget: Budget,
  daysRemaining: number
): number {
  const spent = calculateBudgetSpent(budget, transactions);
  const remaining = budget.amount - spent;
  return daysRemaining > 0 ? remaining / daysRemaining : 0;
}
```

---

### lib/role-based-filters.ts

**Purpose**: Role-based access control utilities

```typescript
export function canAccessResource(
  resource: { user_id: string },
  currentUser: User
): boolean {
  // Admins can access all resources
  if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
    return true;
  }

  // Members can only access their own
  return resource.user_id === currentUser.id;
}

export function canModifyResource(
  resource: { user_id: string },
  currentUser: User
): boolean {
  return canAccessResource(resource, currentUser);
}

export function canDeleteResource(
  resource: { user_id: string },
  currentUser: User
): boolean {
  // Only admins can delete
  if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
    return true;
  }

  return false;
}
```

---

### lib/recurring-execution-service.ts

**Purpose**: Recurring transaction execution logic

```typescript
export async function executeAllDueSeries(
  maxDaysOverdue = 7
): Promise<ExecutionResult> {
  const series = await recurringTransactionService.getUpcoming(maxDaysOverdue);
  const dueSeries = series.filter((s) => isSeriesDue(s));

  const results = {
    summary: {
      totalProcessed: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      totalAmount: 0,
    },
    successful: [] as { seriesId: string; transactionId: string }[],
    failed: [] as { seriesId: string; seriesName: string; error: string }[],
  };

  for (const s of dueSeries) {
    results.summary.totalProcessed++;

    try {
      const transaction = await executeSeries(s);
      results.summary.successfulExecutions++;
      results.summary.totalAmount += transaction.amount;
      results.successful.push({
        seriesId: s.id,
        transactionId: transaction.id,
      });
    } catch (error) {
      results.summary.failedExecutions++;
      results.failed.push({
        seriesId: s.id,
        seriesName: s.description,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

function isSeriesDue(series: RecurringTransactionSeries): boolean {
  const dueDate = new Date(series.due_date);
  const today = new Date();
  return dueDate <= today;
}

async function executeSeries(
  series: RecurringTransactionSeries
): Promise<Transaction> {
  // Create transaction from series
  const transaction = await transactionService.create({
    user_id: series.user_id,
    account_id: series.account_id,
    amount: series.amount,
    type: series.type,
    category: series.category,
    description: series.description,
    date: getTodayString(),
    frequency: 'once',
    recurring_series_id: series.id,
  });

  // Update series next due date
  const nextDueDate = calculateNextDueDate(series);
  await recurringTransactionService.update(series.id, {
    due_date: nextDueDate,
  });

  return transaction;
}
```

---

## Query Utilities

### lib/query-keys.ts

**Purpose**: Centralized React Query key management

```typescript
export const queryKeys = {
  users: {
    all: () => ['users', 'all'] as const,
    detail: (id: string) => ['users', id] as const,
  },
  transactions: {
    all: () => ['transactions', 'all'] as const,
    list: (userId?: string, filters?: any) => ['transactions', 'list', userId, filters] as const,
    detail: (id: string) => ['transactions', id] as const,
  },
  budgets: {
    all: () => ['budgets', 'all'] as const,
    list: (periodId?: string) => ['budgets', 'list', periodId] as const,
    detail: (id: string) => ['budgets', id] as const,
    analysis: (id: string) => ['budgets', id, 'analysis'] as const,
  },
  categories: {
    all: () => ['categories', 'all'] as const,
  },
  accounts: {
    all: () => ['accounts', 'all'] as const,
  },
  budgetPeriods: {
    all: () => ['budget-periods', 'all'] as const,
    current: () => ['budget-periods', 'current'] as const,
  },
  recurringSeries: {
    all: () => ['recurring-series', 'all'] as const,
    upcoming: (days: number, userId?: string) => ['recurring-series', 'upcoming', days, userId] as const,
  },
};
```

---

### lib/query-cache-utils.ts

**Purpose**: Cache update utilities for optimistic updates

```typescript
export function updateTransactionCache(
  queryClient: QueryClient,
  transaction: Transaction
) {
  // Update detail cache
  queryClient.setQueryData(queryKeys.transactions.detail(transaction.id), transaction);

  // Update list caches
  queryClient.setQueriesData(
    { queryKey: ['transactions', 'list'] },
    (old: Transaction[] | undefined) => {
      if (!old) return old;
      const exists = old.find((t) => t.id === transaction.id);
      if (exists) {
        return old.map((t) => (t.id === transaction.id ? transaction : t));
      } else {
        return [transaction, ...old];
      }
    }
  );
}

export function removeTransactionFromCache(
  queryClient: QueryClient,
  transactionId: string
) {
  // Remove detail cache
  queryClient.removeQueries({ queryKey: queryKeys.transactions.detail(transactionId) });

  // Remove from list caches
  queryClient.setQueriesData(
    { queryKey: ['transactions', 'list'] },
    (old: Transaction[] | undefined) => {
      if (!old) return old;
      return old.filter((t) => t.id !== transactionId);
    }
  );
}
```

---

### lib/query-config.ts

**Purpose**: React Query stale time configuration

```typescript
export const CACHE_CONFIG = {
  users: 10 * 60 * 1000, // 10 minutes
  accounts: 5 * 60 * 1000, // 5 minutes
  categories: 5 * 60 * 1000, // 5 minutes
  transactions: 2 * 60 * 1000, // 2 minutes
  budgets: 2 * 60 * 1000, // 2 minutes
  budgetPeriods: 5 * 60 * 1000, // 5 minutes
  recurringSeries: 5 * 60 * 1000, // 5 minutes
  financial: 1 * 60 * 1000, // 1 minute
};
```

---

## Best Practices

### Service Layer

1. **Pure functions** - No side effects, predictable outputs
2. **Single responsibility** - One concern per service
3. **Type safety** - Full TypeScript coverage
4. **Performance** - O(n) algorithms, use Map for lookups
5. **Testability** - No React dependencies

### View Models

1. **Transform, don't mutate** - Create new objects
2. **Memoize in hooks** - Use `useMemo` for view models
3. **Include all UI needs** - Lookups, labels, calculations
4. **Document structure** - Clear TypeScript interfaces
5. **Keep logic here** - Not in components

### Utilities

1. **General purpose** - Reusable across app
2. **Well-named** - Clear, descriptive names
3. **Documented** - JSDoc comments
4. **Type-safe** - Full TypeScript
5. **Tested** - Unit tests (future)

---

**Status**: ✅ Production Ready
**Last Updated**: October 2025
**Maintainer**: Wealth Pillar Team
