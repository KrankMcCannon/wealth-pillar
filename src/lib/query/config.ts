/**
 * React Query Configuration
 * Centralized staleTime and cacheTime (gcTime) configurations
 * Ensures consistent caching behavior across all hooks
 */

/**
 * Standard staleTime configurations for different data types
 * staleTime: How long data is considered fresh before requiring a refetch
 *
 * Categories:
 * - Reference data: Changes rarely (users, categories) - 5-10 minutes
 * - Financial data: Changes frequently (transactions, balances) - 30 seconds - 2 minutes
 * - Computed data: Derived from other data (analytics, summaries) - 1 minute
 * - Volatile data: Real-time or frequently changing - 15-30 seconds
 */
export const QUERY_STALE_TIMES = {
  // Reference data (changes rarely)
  users: 5 * 60 * 1000,        // 5 minutes
  categories: 10 * 60 * 1000,  // 10 minutes
  groups: 5 * 60 * 1000,       // 5 minutes

  // Financial core data (changes frequently)
  transactions: 30 * 1000,      // 30 seconds
  accounts: 2 * 60 * 1000,      // 2 minutes
  budgets: 2 * 60 * 1000,       // 2 minutes

  // Computed/derived data (medium frequency)
  budgetPeriods: 1 * 60 * 1000,        // 1 minute
  budgetAnalysis: 30 * 1000,           // 30 seconds
  financialSummary: 1 * 60 * 1000,     // 1 minute
  spendingTrends: 1 * 60 * 1000,       // 1 minute
  accountBalances: 2 * 60 * 1000,      // 2 minutes

  // Recurring transactions
  recurringSeries: 2 * 60 * 1000,      // 2 minutes
  recurringDashboard: 1 * 60 * 1000,   // 1 minute
  recurringStats: 1 * 60 * 1000,       // 1 minute

  // Investment data (updates less frequently)
  investments: 2 * 60 * 1000,          // 2 minutes
  portfolioData: 1 * 60 * 1000,        // 1 minute

  // Dashboard and aggregated views
  dashboard: 1 * 60 * 1000,            // 1 minute
  upcomingTransactions: 2 * 60 * 1000, // 2 minutes
} as const;

/**
 * Garbage collection times (gcTime, formerly cacheTime)
 * How long unused data stays in cache before being garbage collected
 *
 * Generally set to 5-10x the staleTime for efficient memory management
 */
export const QUERY_GC_TIMES = {
  // Reference data - keep longer in cache
  users: 30 * 60 * 1000,       // 30 minutes
  categories: 60 * 60 * 1000,  // 1 hour
  groups: 30 * 60 * 1000,      // 30 minutes

  // Financial data - moderate cache duration
  transactions: 5 * 60 * 1000,  // 5 minutes
  accounts: 10 * 60 * 1000,     // 10 minutes
  budgets: 10 * 60 * 1000,      // 10 minutes

  // Computed data - shorter cache
  budgetPeriods: 5 * 60 * 1000,        // 5 minutes
  budgetAnalysis: 3 * 60 * 1000,       // 3 minutes
  financialSummary: 5 * 60 * 1000,     // 5 minutes
  spendingTrends: 5 * 60 * 1000,       // 5 minutes
  accountBalances: 10 * 60 * 1000,     // 10 minutes

  // Recurring transactions
  recurringSeries: 10 * 60 * 1000,     // 10 minutes
  recurringDashboard: 5 * 60 * 1000,   // 5 minutes
  recurringStats: 5 * 60 * 1000,       // 5 minutes

  // Investment data
  investments: 10 * 60 * 1000,         // 10 minutes
  portfolioData: 5 * 60 * 1000,        // 5 minutes

  // Dashboard and aggregated views
  dashboard: 5 * 60 * 1000,            // 5 minutes
  upcomingTransactions: 10 * 60 * 1000, // 10 minutes
} as const;

/**
 * Refetch strategies for different scenarios
 * Controls when React Query automatically refetches data
 */
export const REFETCH_STRATEGIES = {
  // Always refetch on window focus for financial data
  financial: {
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
  },

  // Conservative refetch for reference data
  reference: {
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: false,
  },

  // Moderate refetch for computed data
  computed: {
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: false,
  },

  // No automatic refetch (manual only)
  manual: {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  },
} as const;

/**
 * Helper to get complete query options for a data type
 */
export function getQueryOptions<T extends keyof typeof QUERY_STALE_TIMES>(
  dataType: T,
  strategy: keyof typeof REFETCH_STRATEGIES = 'financial'
) {
  return {
    staleTime: QUERY_STALE_TIMES[dataType],
    gcTime: QUERY_GC_TIMES[dataType],
    ...REFETCH_STRATEGIES[strategy],
  };
}

/**
 * Type-safe helper to create consistent query configurations
 * Usage:
 *   const queryOptions = createQueryConfig('transactions', 'financial');
 */
export function createQueryConfig<T extends keyof typeof QUERY_STALE_TIMES>(
  dataType: T,
  options?: {
    strategy?: keyof typeof REFETCH_STRATEGIES;
    refetchInterval?: number;
    enabled?: boolean;
  }
) {
  const strategy = options?.strategy || 'financial';

  return {
    staleTime: QUERY_STALE_TIMES[dataType],
    gcTime: QUERY_GC_TIMES[dataType],
    ...REFETCH_STRATEGIES[strategy],
    ...(options?.refetchInterval && { refetchInterval: options.refetchInterval }),
    ...(options?.enabled !== undefined && { enabled: options.enabled }),
  };
}
