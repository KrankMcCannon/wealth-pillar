/**
 * Wealth Pillar React Query Hooks
 * OPTIMIZED: Using performance-enhanced mutation hooks
 */

// Core query hooks for basic data fetching (read-only operations)
export {
  useAccount, useAccounts,
  useAccountsByUser, useActiveBudgetPeriods, useBudget,
  useBudgetPeriods,
  useBudgetPeriodsByUser, useBudgets,
  useBudgetsByUser, useCategories, useCurrentBudgetPeriod, useCurrentUser, useInvestments,
  useInvestmentsByUser,
  usePortfolioData, useTransactions, useTransactionsByAccount, useTransactionsByUser, useTransactionsWithFilters,
  useUpcomingTransactions, useUser, useUsers
} from './use-query-hooks';

// OPTIMIZED: Transaction mutations with reduced invalidations
export {
  useCreateTransaction, useDeleteTransaction, useUpdateTransaction
} from './use-transaction-mutations';

// OPTIMIZED: Budget mutations with reduced invalidations
export {
  useCreateBudget, useCreateBudgetPeriod, useEndBudgetPeriod, useStartBudgetPeriod, useUpdateBudget, useUpdateBudgetPeriod
} from './use-budget-mutations';

// Dashboard-specific composite hooks
export {
  useDashboardData
} from './useDashboard';

// Advanced financial analysis hooks (no legacy mutations)
export {
  useAccountBalance, useBudgetPerformance, useTransactionTrends
} from './use-financial-queries';

// Prefer the centralized financial summary from use-query-hooks
export { useFinancialSummary } from './use-query-hooks';

// Dashboard hooks
export {
  useDashboardCore
} from './useDashboardCore';

export {
  useDashboardBudgets
} from './useDashboardBudgets';

export {
  useUserSelection
} from './useUserSelection';

export {
  useDashboardPrefetch
} from './useDashboardPrefetch';

// Recurring Transaction Series management (new architecture)
export {
  useActiveRecurringSeries, useCreateRecurringSeries, useDeleteRecurringSeries, useExecuteRecurringSeries, usePauseRecurringSeries, useRecurringSeries,
  useRecurringSeriesById,
  useRecurringSeriesByUser, useRecurringSeriesStats, useResumeRecurringSeries, useUpcomingRecurringSeries, useUpdateRecurringSeries
} from './use-recurring-series';

// Recurring execution and reconciliation
export {
  useDryRunExecution, useExecuteAllDueSeries, useMissedExecutions, useSeriesReconciliation, useSeriesTransactions
} from './use-recurring-execution';

// Cache utilities to apply consistent invalidation logic
export { transactionCacheUtils } from './use-query-hooks';
