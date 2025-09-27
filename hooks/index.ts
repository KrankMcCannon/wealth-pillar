/**
 * Wealth Pillar React Query Hooks
 */

// Core query hooks for basic data fetching
export {
  useAccount, useAccounts,
  useAccountsByUser, useActiveBudgetPeriods, useBudget,
  useBudgetPeriods,
  useBudgetPeriodsByUser, useBudgets,
  useBudgetsByUser, useCategories, useCreateBudget, useCreateBudgetPeriod, useCreateTransaction, useCurrentBudgetPeriod, useCurrentUser, useDeleteTransaction, useEndBudgetPeriod, useInvestments,
  useInvestmentsByUser,
  usePortfolioData, useStartBudgetPeriod, useTransactions, useTransactionsByAccount, useTransactionsByUser, useTransactionsWithFilters,
  useUpcomingTransactions, useUpdateBudget, useUpdateBudgetPeriod, useUpdateTransaction, useUser, useUsers
} from './use-query-hooks';

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
