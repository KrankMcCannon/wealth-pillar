/**
 * Wealth Pillar React Query Hooks
 */

// Core query hooks for basic data fetching
export {
  useAccount, useAccounts,
  useAccountsByUser, useActiveBudgetPeriods, useBudget,
  useBudgetPeriods,
  useBudgetPeriodsByUser, useBudgets,
  useBudgetsByUser, useCategories, useCreateBudget, useCreateTransaction, useCurrentBudgetPeriod, useCurrentUser, useDeleteTransaction, useInvestments,
  useInvestmentsByUser,
  usePortfolioData, useTransactions, useTransactionsByAccount, useTransactionsByUser, useTransactionsWithFilters,
  useUpcomingTransactions, useUpdateBudget, useUpdateTransaction, useUser, useUsers,
  useStartBudgetPeriod, useEndBudgetPeriod, useCreateBudgetPeriod, useUpdateBudgetPeriod
} from './use-query-hooks';

// Dashboard-specific composite hooks
export {
  useDashboardData,
  usePrefetchDashboard
} from './useDashboard';

// Advanced financial analysis hooks
export {
  useAccountBalance, useBudgetPerformance, useBulkTransactionOperations, useFinancialSummary, useOptimisticTransaction, useTransactionTrends
} from './use-financial-queries';

// Centralized user selection
export {
  useUserSelection
} from './useUserSelection';
