/**
 * Query Key Factory Pattern for Wealth Pillar
 *
 * Implements hierarchical query keys for precise cache invalidation
 * and efficient data management in a financial application.
 *
 * Key Design Principles:
 * 1. Hierarchical structure for targeted invalidation
 * 2. Type-safe key generation
 * 3. Consistent naming conventions
 * 4. Support for complex filtering scenarios
 */

export const queryKeys = {
  // Root level keys for global invalidation
  all: ['wealth-pillar'] as const,

  // User-related queries
  users: () => [...queryKeys.all, 'users'] as const,
  user: (id: string) => [...queryKeys.users(), id] as const,
  userProfile: (id: string) => [...queryKeys.user(id), 'profile'] as const,
  userFinancialData: (id: string) => [...queryKeys.user(id), 'financial-data'] as const,

  // Group-related queries
  groups: () => [...queryKeys.all, 'groups'] as const,
  group: (id: string) => [...queryKeys.groups(), id] as const,
  groupMembers: (id: string) => [...queryKeys.group(id), 'members'] as const,

  // Account-related queries
  accounts: () => [...queryKeys.all, 'accounts'] as const,
  account: (id: string) => [...queryKeys.accounts(), id] as const,
  accountsByUser: (userId: string) => [...queryKeys.accounts(), 'user', userId] as const,
  accountBalance: (id: string) => [...queryKeys.account(id), 'balance'] as const,
  accountTransactions: (id: string) => [...queryKeys.account(id), 'transactions'] as const,

  // Transaction-related queries
  transactions: () => [...queryKeys.all, 'transactions'] as const,
  transaction: (id: string) => [...queryKeys.transactions(), id] as const,
  transactionsByUser: (userId: string) => [...queryKeys.transactions(), 'user', userId] as const,
  transactionsByAccount: (accountId: string) => [...queryKeys.transactions(), 'account', accountId] as const,
  transactionsByType: (type: string) => [...queryKeys.transactions(), 'type', type] as const,
  transactionsByCategory: (category: string) => [...queryKeys.transactions(), 'category', category] as const,
  transactionsWithFilters: (filters: Record<string, unknown>) => [
    ...queryKeys.transactions(),
    'filtered',
    filters
  ] as const,
  upcomingTransactions: (userId?: string) => [
    ...queryKeys.transactions(),
    'upcoming',
    userId || 'all'
  ] as const,

  // Recurring Transaction Series queries
  recurringSeries: () => [...queryKeys.all, 'recurring-series'] as const,
  recurringSeriesById: (id: string) => [...queryKeys.recurringSeries(), id] as const,
  recurringSeriesByUser: (userId: string) => [...queryKeys.recurringSeries(), 'user', userId] as const,
  activeRecurringSeries: (userId?: string) => [
    ...queryKeys.recurringSeries(),
    'active',
    userId || 'all'
  ] as const,
  upcomingRecurringSeries: (days: number, userId?: string) => [
    ...queryKeys.recurringSeries(),
    'upcoming',
    days,
    userId || 'all'
  ] as const,
  recurringSeriesStats: (userId?: string) => [
    ...queryKeys.recurringSeries(),
    'stats',
    userId || 'all'
  ] as const,

  // Budget-related queries
  budgets: () => [...queryKeys.all, 'budgets'] as const,
  budget: (id: string) => [...queryKeys.budgets(), id] as const,
  budgetsByUser: (userId: string) => [...queryKeys.budgets(), 'user', userId] as const,
  budgetPeriods: () => [...queryKeys.users(), 'budget_periods'] as const,
  budgetPeriod: (id: string) => [...queryKeys.budgetPeriods(), id] as const,
  budgetPeriodsByBudget: (budgetId: string) => [...queryKeys.budgetPeriods(), 'budget', budgetId] as const,
  budgetPeriodsByUser: (userId: string) => [...queryKeys.user(userId), 'budget_periods'] as const,
  activeBudgetPeriods: (userId?: string) => [
    ...queryKeys.budgetPeriods(),
    'active',
    userId || 'all'
  ] as const,
  currentBudgetPeriod: (budgetId: string) => [...queryKeys.budget(budgetId), 'current_period'] as const,

  // Category-related queries (reference data)
  categories: () => [...queryKeys.all, 'reference', 'categories'] as const,
  category: (id: string) => [...queryKeys.categories(), id] as const,

  // Investment-related queries
  investments: () => [...queryKeys.all, 'investments'] as const,
  investment: (id: string) => [...queryKeys.investments(), id] as const,
  investmentsByUser: (userId: string) => [...queryKeys.investments(), 'user', userId] as const,
  portfolioData: (userId: string) => [...queryKeys.investmentsByUser(userId), 'portfolio'] as const,

  // Dashboard composite queries
  dashboard: () => [...queryKeys.all, 'dashboard'] as const,
  dashboardData: (userFilter?: string) => [
    ...queryKeys.dashboard(),
    'data',
    userFilter || 'all'
  ] as const,

  // Financial aggregation queries
  financial: () => [...queryKeys.all, 'financial'] as const,
  totalBalance: (userFilter?: string) => [
    ...queryKeys.financial(),
    'total-balance',
    userFilter || 'all'
  ] as const,
  accountBalances: (userFilter?: string) => [
    ...queryKeys.financial(),
    'account-balances',
    userFilter || 'all'
  ] as const,
  budgetData: (userFilter?: string) => [
    ...queryKeys.financial(),
    'budget-data',
    userFilter || 'all'
  ] as const,
} as const;

/**
 * Type-safe query key generator for custom queries
 */
export type QueryKeyFactory = typeof queryKeys;

/**
 * Utility functions for working with query keys
 */
export const queryKeyUtils = {
  /**
   * Invalidate all user-related data
   */
  invalidateUserData: (userId: string) => [
    queryKeys.user(userId),
    queryKeys.accountsByUser(userId),
    queryKeys.transactionsByUser(userId),
    queryKeys.budgetsByUser(userId),
    queryKeys.investmentsByUser(userId),
  ],

  /**
   * Invalidate all financial calculations
   */
  invalidateFinancialData: () => [
    queryKeys.financial(),
    queryKeys.dashboard(),
  ],

  /**
   * Invalidate data after transaction mutation
   */
  invalidateAfterTransaction: (transaction: { user_id: string; account_id: string; category: string }) => [
    queryKeys.transactionsByUser(transaction.user_id),
    queryKeys.transactionsByAccount(transaction.account_id),
    queryKeys.transactionsByCategory(transaction.category),
    queryKeys.accountBalance(transaction.account_id),
    queryKeys.financial(),
    queryKeys.dashboard(),
  ],

  /**
   * Invalidate data after budget mutation
   */
  invalidateAfterBudget: (budget: { user_id: string; id: string }) => [
    queryKeys.budgetsByUser(budget.user_id),
    queryKeys.budget(budget.id),
    queryKeys.budgetData(),
    queryKeys.dashboard(),
  ],

  /**
   * Get all keys that should be prefetched for dashboard
   */
  getDashboardPrefetchKeys: (userFilter?: string) => [
    queryKeys.users(),
    queryKeys.accounts(),
    queryKeys.categories(),
    queryKeys.dashboardData(userFilter),
  ],
};
