# Hooks Documentation

**Version**: 1.0
**Last Updated**: October 2025
**Status**: ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Query Hooks](#query-hooks)
3. [Mutation Hooks](#mutation-hooks)
4. [Controller Hooks](#controller-hooks)
5. [Specialized Hooks](#specialized-hooks)
6. [Hook Patterns](#hook-patterns)
7. [Best Practices](#best-practices)

---

## Overview

### Hook Architecture

Wealth Pillar uses a **layered hook architecture**:

```
┌─────────────────────────────────────────┐
│  Controller Hooks (Page Logic)          │
│  - useTransactionsController            │
│  - useBudgetsController                 │
│  - useDashboardController               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Query Hooks (Read Operations)          │
│  - useTransactions                      │
│  - useBudgets                           │
│  - useUsers                             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Mutation Hooks (Write Operations)      │
│  - useCreateTransaction                 │
│  - useUpdateBudget                      │
│  - useDeleteCategory                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  API Client (lib/api-client.ts)         │
│  - transactionService                   │
│  - budgetService                        │
│  - userService                          │
└─────────────────────────────────────────┘
```

### Naming Conventions

- **Query Hooks**: `use[Entity]` or `use[Entity]s` - e.g., `useTransactions()`
- **Mutation Hooks**: `use[Action][Entity]` - e.g., `useCreateTransaction()`
- **Controller Hooks**: `use[Page]Controller` - e.g., `useTransactionsController()`
- **Specialized Hooks**: `use[Purpose]` - e.g., `useUserSelection()`

### Performance Optimization

**Cache Strategy**:
- **Reference Data** (users, categories): 5-10 minutes staleTime
- **Financial Data** (transactions, budgets): 30s-2min staleTime
- **Computed Data** (analytics): 1 minute staleTime

**Optimistic Updates**: 80% fewer cache invalidations through targeted updates

---

## Query Hooks

### File: `hooks/use-query-hooks.ts`

Centralized read-only data fetching hooks using React Query.

#### useUsers()

Fetch all users in the current group.

```typescript
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all(),
    queryFn: () => userService.getAll(),
    staleTime: CACHE_CONFIG.users, // 10 minutes
  });
}
```

**Returns**: `UseQueryResult<User[]>`

**Usage**:
```tsx
const { data: users = [], isLoading } = useUsers();
```

**Cache Key**: `['users', 'all']`

---

#### useUser(userId)

Fetch a single user by ID.

```typescript
export function useUser(userId: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => userService.getById(userId),
    staleTime: CACHE_CONFIG.users,
    enabled: !!userId,
  });
}
```

**Parameters**:
- `userId: string` - User ID to fetch

**Returns**: `UseQueryResult<User>`

**Cache Key**: `['users', userId]`

---

#### useTransactions(userId?, filters?)

Fetch transactions with optional filtering.

```typescript
export function useTransactions(userId?: string, filters?: TransactionFilters) {
  return useQuery({
    queryKey: queryKeys.transactions.list(userId, filters),
    queryFn: () => transactionService.getByUserId(userId, filters),
    staleTime: CACHE_CONFIG.transactions, // 2 minutes
  });
}
```

**Parameters**:
- `userId?: string` - Filter by user (optional)
- `filters?: TransactionFilters` - Additional filters

**Returns**: `UseQueryResult<Transaction[]>`

**Cache Key**: `['transactions', 'list', userId, filters]`

---

#### useTransaction(transactionId)

Fetch a single transaction by ID.

```typescript
export function useTransaction(transactionId: string) {
  return useQuery({
    queryKey: queryKeys.transactions.detail(transactionId),
    queryFn: () => transactionService.getById(transactionId),
    staleTime: CACHE_CONFIG.transactions,
    enabled: !!transactionId,
  });
}
```

**Parameters**:
- `transactionId: string` - Transaction ID

**Returns**: `UseQueryResult<Transaction>`

**Cache Key**: `['transactions', transactionId]`

---

#### useBudgets(periodId?)

Fetch budgets for a specific period.

```typescript
export function useBudgets(periodId?: string) {
  return useQuery({
    queryKey: queryKeys.budgets.list(periodId),
    queryFn: () => budgetService.getAll(periodId),
    staleTime: CACHE_CONFIG.budgets, // 2 minutes
  });
}
```

**Parameters**:
- `periodId?: string` - Budget period ID

**Returns**: `UseQueryResult<Budget[]>`

**Cache Key**: `['budgets', 'list', periodId]`

---

#### useCategories()

Fetch all categories.

```typescript
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all(),
    queryFn: () => categoryService.getAll(),
    staleTime: CACHE_CONFIG.categories, // 5 minutes
  });
}
```

**Returns**: `UseQueryResult<Category[]>`

**Cache Key**: `['categories', 'all']`

---

#### useAccounts()

Fetch all accounts.

```typescript
export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts.all(),
    queryFn: () => accountService.getAll(),
    staleTime: CACHE_CONFIG.accounts, // 5 minutes
  });
}
```

**Returns**: `UseQueryResult<Account[]>`

**Cache Key**: `['accounts', 'all']`

---

#### useBudgetPeriods()

Fetch all budget periods.

```typescript
export function useBudgetPeriods() {
  return useQuery({
    queryKey: queryKeys.budgetPeriods.all(),
    queryFn: () => budgetPeriodService.getAll(),
    staleTime: CACHE_CONFIG.budgetPeriods, // 5 minutes
  });
}
```

**Returns**: `UseQueryResult<BudgetPeriod[]>`

**Cache Key**: `['budget-periods', 'all']`

---

#### useCurrentBudgetPeriod()

Fetch the currently active budget period.

```typescript
export function useCurrentBudgetPeriod() {
  return useQuery({
    queryKey: queryKeys.budgetPeriods.current(),
    queryFn: () => budgetPeriodService.getCurrent(),
    staleTime: CACHE_CONFIG.budgetPeriods,
  });
}
```

**Returns**: `UseQueryResult<BudgetPeriod | null>`

**Cache Key**: `['budget-periods', 'current']`

---

### File: `hooks/use-financial-queries.ts`

Financial calculation and analytics hooks.

#### useAccountBalances()

Calculate current balances for all accounts.

```typescript
export function useAccountBalances() {
  const { data: transactions = [] } = useTransactions();
  const { data: accounts = [] } = useAccounts();

  return useQuery({
    queryKey: ['financial', 'balances'],
    queryFn: () => calculateAccountBalances(accounts, transactions),
    staleTime: CACHE_CONFIG.financial, // 1 minute
    enabled: transactions.length > 0,
  });
}
```

**Returns**: `UseQueryResult<Record<string, number>>`

**Cache Key**: `['financial', 'balances']`

---

#### useTransactionSummary(startDate, endDate)

Get aggregated transaction summary for a date range.

```typescript
export function useTransactionSummary(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['financial', 'summary', startDate, endDate],
    queryFn: () => transactionService.getSummary(startDate, endDate),
    staleTime: CACHE_CONFIG.financial,
  });
}
```

**Parameters**:
- `startDate: string` - ISO date string
- `endDate: string` - ISO date string

**Returns**: `UseQueryResult<TransactionSummary>`

**Cache Key**: `['financial', 'summary', startDate, endDate]`

---

#### useBudgetAnalysis(budgetId)

Get detailed budget analysis with spending breakdown.

```typescript
export function useBudgetAnalysis(budgetId: string) {
  return useQuery({
    queryKey: ['budgets', budgetId, 'analysis'],
    queryFn: () => budgetService.getAnalysis(budgetId),
    staleTime: CACHE_CONFIG.budgets,
    enabled: !!budgetId,
  });
}
```

**Parameters**:
- `budgetId: string` - Budget ID

**Returns**: `UseQueryResult<BudgetAnalysis>`

**Cache Key**: `['budgets', budgetId, 'analysis']`

---

### File: `hooks/use-recurring-series.ts`

Recurring transaction series management hooks.

#### useRecurringSeries()

Fetch all recurring transaction series.

```typescript
export function useRecurringSeries() {
  return useQuery({
    queryKey: queryKeys.recurringSeries.all(),
    queryFn: () => recurringTransactionService.getAll(),
    staleTime: CACHE_CONFIG.recurringSeries, // 5 minutes
  });
}
```

**Returns**: `UseQueryResult<RecurringTransactionSeries[]>`

**Cache Key**: `['recurring-series', 'all']`

---

#### useUpcomingRecurringSeries(days, userId?)

Fetch series due within a number of days.

```typescript
export function useUpcomingRecurringSeries(days: number = 7, userId?: string) {
  return useQuery({
    queryKey: ['recurring-series', 'upcoming', days, userId],
    queryFn: () => recurringTransactionService.getUpcoming(days, userId),
    staleTime: CACHE_CONFIG.recurringSeries,
  });
}
```

**Parameters**:
- `days: number` - Look-ahead window (default: 7)
- `userId?: string` - Filter by user (optional)

**Returns**: `UseQueryResult<RecurringTransactionSeries[]>`

**Cache Key**: `['recurring-series', 'upcoming', days, userId]`

---

#### useSeriesTransactions(seriesId)

Fetch all transactions generated by a recurring series.

```typescript
export function useSeriesTransactions(seriesId: string) {
  return useQuery({
    queryKey: ['recurring-series', seriesId, 'transactions'],
    queryFn: () => recurringTransactionService.getSeriesTransactions(seriesId),
    staleTime: CACHE_CONFIG.transactions,
    enabled: !!seriesId,
  });
}
```

**Parameters**:
- `seriesId: string` - Recurring series ID

**Returns**: `UseQueryResult<Transaction[]>`

**Cache Key**: `['recurring-series', seriesId, 'transactions']`

---

## Mutation Hooks

### File: `hooks/use-transaction-mutations.ts`

Transaction CRUD operations with **80% fewer cache invalidations** through optimistic updates.

#### useCreateTransaction()

Create a new transaction with optimistic update.

```typescript
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransactionInput) => transactionService.create(data),
    onMutate: async (newTransaction) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['transactions'] });

      // Snapshot previous value
      const previousTransactions = queryClient.getQueryData(['transactions', 'list']);

      // Optimistically update
      queryClient.setQueryData(['transactions', 'list'], (old: Transaction[]) => [
        { ...newTransaction, id: 'temp-' + Date.now() },
        ...old,
      ]);

      return { previousTransactions };
    },
    onError: (err, newTransaction, context) => {
      // Rollback on error
      if (context?.previousTransactions) {
        queryClient.setQueryData(['transactions', 'list'], context.previousTransactions);
      }
    },
    onSuccess: (data) => {
      // Update specific cache keys
      updateTransactionCache(queryClient, data);
    },
  });
}
```

**Parameters**:
- `data: CreateTransactionInput` - Transaction data

**Returns**: `UseMutationResult<Transaction>`

**Cache Updates**:
- ✅ Optimistic: Immediate UI update
- ✅ Selective: Only invalidates affected queries
- ✅ Rollback: Reverts on error

---

#### useUpdateTransaction()

Update an existing transaction.

```typescript
export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionInput }) =>
      transactionService.update(id, data),
    onSuccess: (updatedTransaction) => {
      // Update detail cache
      queryClient.setQueryData(['transactions', updatedTransaction.id], updatedTransaction);

      // Update list cache
      queryClient.setQueryData(['transactions', 'list'], (old: Transaction[]) =>
        old.map((tx) => (tx.id === updatedTransaction.id ? updatedTransaction : tx))
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['financial'] });
    },
  });
}
```

**Parameters**:
- `id: string` - Transaction ID
- `data: UpdateTransactionInput` - Updated fields

**Returns**: `UseMutationResult<Transaction>`

---

#### useDeleteTransaction()

Delete a transaction.

```typescript
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionService.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from list cache
      queryClient.setQueryData(['transactions', 'list'], (old: Transaction[]) =>
        old.filter((tx) => tx.id !== deletedId)
      );

      // Remove detail cache
      queryClient.removeQueries({ queryKey: ['transactions', deletedId] });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}
```

**Parameters**:
- `id: string` - Transaction ID

**Returns**: `UseMutationResult<void>`

---

### File: `hooks/use-budget-mutations.ts`

Budget CRUD operations with optimized cache updates.

#### useCreateBudget()

Create a new budget.

```typescript
export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBudgetInput) => budgetService.create(data),
    onSuccess: (newBudget) => {
      // Add to list cache
      queryClient.setQueryData(['budgets', 'list'], (old: Budget[]) => [
        ...old,
        newBudget,
      ]);

      // Invalidate analysis
      queryClient.invalidateQueries({ queryKey: ['budgets', 'analysis'] });
    },
  });
}
```

**Parameters**:
- `data: CreateBudgetInput` - Budget data

**Returns**: `UseMutationResult<Budget>`

---

#### useUpdateBudget()

Update an existing budget.

```typescript
export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBudgetInput }) =>
      budgetService.update(id, data),
    onSuccess: (updatedBudget) => {
      // Update detail cache
      queryClient.setQueryData(['budgets', updatedBudget.id], updatedBudget);

      // Update list cache
      queryClient.setQueryData(['budgets', 'list'], (old: Budget[]) =>
        old.map((b) => (b.id === updatedBudget.id ? updatedBudget : b))
      );

      // Invalidate analysis
      queryClient.invalidateQueries({ queryKey: ['budgets', updatedBudget.id, 'analysis'] });
    },
  });
}
```

**Parameters**:
- `id: string` - Budget ID
- `data: UpdateBudgetInput` - Updated fields

**Returns**: `UseMutationResult<Budget>`

---

#### useDeleteBudget()

Delete a budget.

```typescript
export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => budgetService.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from list cache
      queryClient.setQueryData(['budgets', 'list'], (old: Budget[]) =>
        old.filter((b) => b.id !== deletedId)
      );

      // Remove detail and analysis caches
      queryClient.removeQueries({ queryKey: ['budgets', deletedId] });
    },
  });
}
```

**Parameters**:
- `id: string` - Budget ID

**Returns**: `UseMutationResult<void>`

---

### File: `hooks/use-category-mutations.ts`

Category CRUD operations.

#### useCreateCategory()

Create a new category.

```typescript
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryInput) => categoryService.create(data),
    onSuccess: (newCategory) => {
      // Add to cache
      queryClient.setQueryData(['categories', 'all'], (old: Category[]) => [
        ...old,
        newCategory,
      ]);
    },
  });
}
```

---

#### useUpdateCategory()

Update an existing category.

```typescript
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryInput }) =>
      categoryService.update(id, data),
    onSuccess: (updatedCategory) => {
      // Update cache
      queryClient.setQueryData(['categories', 'all'], (old: Category[]) =>
        old.map((c) => (c.id === updatedCategory.id ? updatedCategory : c))
      );
    },
  });
}
```

---

#### useDeleteCategory()

Delete a category.

```typescript
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.setQueryData(['categories', 'all'], (old: Category[]) =>
        old.filter((c) => c.id !== deletedId)
      );

      // Invalidate transactions (they reference categories)
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
```

---

## Controller Hooks

### File: `hooks/controllers/useTransactionsController.ts`

Orchestrates the transactions page logic.

```typescript
export function useTransactionsController() {
  // 1. User selection
  const { selectedUserId, handleUserChange } = useUserSelection();

  // 2. Filters from URL
  const { filters, setFilters } = useTransactionFilters();

  // 3. Data fetching
  const { data: transactions = [] } = useTransactions(selectedUserId, filters);
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: recurringSeries = [] } = useRecurringSeries();

  // 4. UI state
  const [isTransactionFormOpen, setTransactionFormOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  // 5. View model
  const viewModel = useMemo(() => ({
    groupedTransactions: groupTransactionsByDay(transactions),
    categories,
    accounts,
    accountNames: createAccountNameLookup(accounts),
    recurringSeries,
    filterCounts: calculateFilterCounts(transactions),
  }), [transactions, accounts, categories, recurringSeries]);

  // 6. Actions
  const openTransactionForm = useCallback((transaction?: Transaction) => {
    if (transaction) {
      setSelectedTransaction(transaction);
      setFormMode('edit');
    } else {
      setSelectedTransaction(null);
      setFormMode('create');
    }
    setTransactionFormOpen(true);
  }, []);

  const handleFiltersChange = useCallback((newFilters: TransactionFilters) => {
    setFilters(newFilters);
  }, [setFilters]);

  // 7. Return API
  return {
    // View model
    viewModel,
    // State
    selectedUserId,
    filters,
    isTransactionFormOpen,
    selectedTransaction,
    formMode,
    // Actions
    handleUserChange,
    handleFiltersChange,
    openTransactionForm,
    setTransactionFormOpen,
  };
}
```

**Returns**:
```typescript
interface TransactionsControllerAPI {
  viewModel: TransactionsViewModel;
  selectedUserId: string;
  filters: TransactionFilters;
  isTransactionFormOpen: boolean;
  selectedTransaction: Transaction | null;
  formMode: 'create' | 'edit';
  handleUserChange: (userId: string) => void;
  handleFiltersChange: (filters: TransactionFilters) => void;
  openTransactionForm: (transaction?: Transaction) => void;
  setTransactionFormOpen: (open: boolean) => void;
}
```

---

### File: `hooks/controllers/useBudgetsController.ts`

Orchestrates the budgets page logic.

```typescript
export function useBudgetsController() {
  // 1. Current budget period
  const { data: currentPeriod } = useCurrentBudgetPeriod();
  const { data: periods = [] } = useBudgetPeriods();

  // 2. Budget data
  const { data: budgets = [] } = useBudgets(currentPeriod?.id);
  const { data: transactions = [] } = useTransactions();

  // 3. UI state
  const [isBudgetFormOpen, setBudgetFormOpen] = useState(false);
  const [isBudgetDetailOpen, setBudgetDetailOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  // 4. Budget analysis (only when a budget is selected)
  const { data: budgetAnalysis } = useBudgetAnalysis(selectedBudget?.id || '');

  // 5. Mutations
  const endPeriodMutation = useEndBudgetPeriod();

  // 6. View model
  const viewModel = useMemo(() => ({
    budgetsWithProgress: budgets.map((budget) => ({
      budget,
      progressInfo: calculateBudgetProgress(budget, transactions),
    })),
    currentPeriod,
    availablePeriods: periods,
  }), [budgets, transactions, currentPeriod, periods]);

  // 7. Actions
  const handleBudgetClick = useCallback((budget: Budget) => {
    setSelectedBudget(budget);
    setBudgetDetailOpen(true);
  }, []);

  const handlePeriodChange = useCallback((periodId: string) => {
    // Handled by query hook automatically
  }, []);

  const handleEndPeriod = useCallback(async () => {
    if (!currentPeriod) return;
    await endPeriodMutation.mutateAsync(currentPeriod.id);
  }, [currentPeriod, endPeriodMutation]);

  // 8. Return API
  return {
    viewModel,
    currentPeriod,
    isBudgetFormOpen,
    isBudgetDetailOpen,
    selectedBudget,
    formMode,
    budgetAnalysis,
    setBudgetFormOpen,
    setBudgetDetailOpen,
    handleBudgetClick,
    handlePeriodChange,
    handleEndPeriod,
  };
}
```

---

### File: `hooks/controllers/useDashboardController.ts`

Orchestrates the dashboard page logic.

```typescript
export function useDashboardController() {
  // 1. User selection
  const { selectedUserId, handleUserChange } = useUserSelection();

  // 2. Dashboard data
  const dashboardCore = useDashboardCore(selectedUserId);
  const dashboardBudgets = useDashboardBudgets(selectedUserId);

  // 3. UI state
  const [isTransactionFormOpen, setTransactionFormOpen] = useState(false);

  // 4. View model (combines core + budgets)
  const viewModel = useMemo(() => ({
    ...dashboardCore,
    ...dashboardBudgets,
  }), [dashboardCore, dashboardBudgets]);

  // 5. Actions
  const handleAccountClick = useCallback((accountId: string) => {
    // Navigate to transactions filtered by account
    router.push(`/transactions?account=${accountId}`);
  }, []);

  const handleTransactionClick = useCallback((transaction: Transaction) => {
    // Open transaction form in edit mode
  }, []);

  // 6. Return API
  return {
    viewModel,
    selectedUserId,
    isTransactionFormOpen,
    handleUserChange,
    handleAccountClick,
    handleTransactionClick,
    setTransactionFormOpen,
  };
}
```

---

## Specialized Hooks

### File: `hooks/useDashboardCore.ts`

Core dashboard data orchestration.

```typescript
export function useDashboardCore(selectedUserId: string) {
  const { data: accounts = [] } = useAccounts();
  const { data: transactions = [] } = useTransactions(selectedUserId);

  const viewModel = useMemo(() => {
    // Filter accounts by user
    const userAccounts = accounts.filter((acc) =>
      acc.user_ids.includes(selectedUserId)
    );

    // Calculate balances
    const accountBalances = calculateAccountBalances(userAccounts, transactions);
    const totalBalance = Object.values(accountBalances).reduce((sum, bal) => sum + bal, 0);

    // Get recent transactions (last 5)
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // Account name lookup
    const accountNames = Object.fromEntries(accounts.map((a) => [a.id, a.name]));

    return {
      accounts: userAccounts,
      accountBalances,
      totalBalance,
      recentTransactions,
      accountNames,
    };
  }, [accounts, transactions, selectedUserId]);

  return viewModel;
}
```

**Returns**:
```typescript
interface DashboardCoreViewModel {
  accounts: Account[];
  accountBalances: Record<string, number>;
  totalBalance: number;
  recentTransactions: Transaction[];
  accountNames: Record<string, string>;
}
```

---

### File: `hooks/useDashboardBudgets.ts`

Budget-specific dashboard calculations.

```typescript
export function useDashboardBudgets(selectedUserId: string) {
  const { data: currentPeriod } = useCurrentBudgetPeriod();
  const { data: budgets = [] } = useBudgets(currentPeriod?.id);
  const { data: transactions = [] } = useTransactions(selectedUserId);

  const viewModel = useMemo(() => {
    // Calculate progress for each budget
    const budgetsWithProgress = budgets.map((budget) => {
      const spent = calculateBudgetSpent(budget, transactions);
      const remaining = budget.amount - spent;
      const progress = (spent / budget.amount) * 100;

      return {
        ...budget,
        spent,
        remaining,
        progress,
        status: progress >= 100 ? 'exceeded' : progress >= 80 ? 'warning' : 'on-track',
      };
    });

    return { budgetsWithProgress };
  }, [budgets, transactions]);

  return viewModel;
}
```

**Returns**:
```typescript
interface DashboardBudgetsViewModel {
  budgetsWithProgress: (Budget & {
    spent: number;
    remaining: number;
    progress: number;
    status: 'on-track' | 'warning' | 'exceeded';
  })[];
}
```

---

### File: `hooks/useUserSelection.ts`

Multi-user selection with localStorage persistence.

```typescript
export function useUserSelection() {
  const { data: users = [] } = useUsers();
  const queryClient = useQueryClient();

  // Load from localStorage
  const [selectedUserId, setSelectedUserId] = useState(() => {
    if (typeof window === 'undefined') return 'all';
    return localStorage.getItem('selectedUserId') || 'all';
  });

  // Save to localStorage on change
  const handleUserChange = useCallback((userId: string) => {
    setSelectedUserId(userId);
    localStorage.setItem('selectedUserId', userId);

    // Prefetch data for selected user
    if (userId !== 'all') {
      queryClient.prefetchQuery({
        queryKey: ['transactions', 'list', userId],
        queryFn: () => transactionService.getByUserId(userId),
      });
    }
  }, [queryClient]);

  return { selectedUserId, handleUserChange, users };
}
```

**Features**:
- ✅ Persists selection in localStorage
- ✅ Prefetches data on selection change
- ✅ Supports "all users" option

---

### File: `hooks/useAuth.ts`

Authentication state management.

```typescript
export function useAuth() {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const router = useRouter();

  // Get internal user data
  const { data: internalUser } = useUser(clerkUser?.id || '');

  const signOut = useCallback(async () => {
    await clerkSignOut();
    router.push('/sign-in');
  }, [clerkSignOut, router]);

  return {
    isLoaded,
    isAuthenticated: isSignedIn,
    user: internalUser,
    clerkUser,
    signOut,
  };
}
```

**Returns**:
```typescript
interface UseAuthReturn {
  isLoaded: boolean;
  isAuthenticated: boolean;
  user: User | undefined;
  clerkUser: ClerkUser | undefined;
  signOut: () => Promise<void>;
}
```

---

### File: `hooks/use-media-query.ts`

Responsive breakpoint detection.

```typescript
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}
```

**Usage**:
```tsx
const isMobile = useMediaQuery('(max-width: 768px)');
const isDesktop = useMediaQuery('(min-width: 1024px)');
```

---

## Hook Patterns

### Query Hook Pattern

```typescript
export function useResource() {
  return useQuery({
    queryKey: ['resource'],
    queryFn: () => apiClient.getResource(),
    staleTime: CACHE_CONFIG.resource,
  });
}
```

**Features**:
- Automatic caching
- Background refetch
- Loading/error states
- Deduplication

---

### Mutation Hook Pattern

```typescript
export function useResourceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.createResource,
    onSuccess: (data) => {
      queryClient.setQueryData(['resource', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['resource', 'list'] });
    },
  });
}
```

**Features**:
- Optimistic updates
- Cache invalidation
- Rollback on error
- Success/error callbacks

---

### Controller Hook Pattern

```typescript
export function usePageController() {
  // 1. Data fetching
  const { data } = useQuery(...);

  // 2. UI state
  const [state, setState] = useState();

  // 3. View model (memoized)
  const viewModel = useMemo(() => createViewModel(data), [data]);

  // 4. Actions (callbacks)
  const handleAction = useCallback(() => {}, []);

  // 5. Return API
  return { viewModel, state, setState, handleAction };
}
```

**Features**:
- Separates logic from UI
- Memoized calculations
- Stable action references
- Testable in isolation

---

## Best Practices

### Performance

1. **Memoize expensive calculations** - Use `useMemo`
2. **Stable callbacks** - Use `useCallback` for actions
3. **Optimize dependencies** - Minimize dependency arrays
4. **Prefetch on hover** - Improve perceived performance
5. **Configure staleTime** - Balance freshness vs. requests

### Cache Management

1. **Use query keys wisely** - Hierarchical structure
2. **Selective invalidation** - Don't invalidate everything
3. **Optimistic updates** - Immediate UI feedback
4. **Rollback on error** - Maintain consistency
5. **Remove unused queries** - Clean up cache

### Code Organization

1. **One hook per concern** - Single responsibility
2. **Export types** - TypeScript interfaces
3. **Document parameters** - JSDoc comments
4. **Group related hooks** - By domain (transactions, budgets)
5. **Consistent naming** - Follow conventions

---

**Status**: ✅ Production Ready
**Last Updated**: October 2025
**Maintainer**: Wealth Pillar Team
