/**
 * Centralized cache update utilities for TanStack Query
 *
 * Implements DRY principle by providing reusable cache update functions
 * Follows SOLID principles with single responsibility per function
 *
 * Performance optimization:
 * - Uses direct cache updates instead of broad invalidations
 * - Reduces unnecessary API calls by updating existing cache data
 * - Selective invalidation only when necessary
 */

import type { QueryClient } from '@tanstack/react-query';
import { Budget, BudgetPeriod, Transaction } from '../types';
import { queryKeys } from './keys';

/**
 * Smart cache update for transactions
 * Updates all relevant caches without triggering refetches
 */
export const updateTransactionInCache = (
  queryClient: QueryClient,
  transaction: Transaction,
  operation: 'create' | 'update' | 'delete'
) => {
  // Helper to update transaction in a list
  const updateList = (list: Transaction[] | undefined): Transaction[] => {
    if (!list) return operation === 'create' ? [transaction] : [];

    if (operation === 'delete') {
      return list.filter(tx => tx.id !== transaction.id);
    }

    if (operation === 'update') {
      const exists = list.some(tx => tx.id === transaction.id);
      if (exists) {
        return list.map(tx => tx.id === transaction.id ? transaction : tx)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    }

    if (operation === 'create') {
      return [transaction, ...list]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return list;
  };

  // Update main transactions cache
  queryClient.setQueryData(queryKeys.transactions(), updateList);

  // Update user-specific cache
  queryClient.setQueryData(
    queryKeys.transactionsByUser(transaction.user_id),
    updateList
  );

  // Update account-specific cache
  queryClient.setQueryData(
    queryKeys.transactionsByAccount(transaction.account_id),
    updateList
  );

  // Update individual transaction cache
  if (operation === 'delete') {
    queryClient.removeQueries({ queryKey: queryKeys.transaction(transaction.id) });
  } else {
    queryClient.setQueryData(queryKeys.transaction(transaction.id), transaction);
  }

  // Update filtered queries that may contain this transaction
  queryClient.getQueriesData({ queryKey: [...queryKeys.transactions(), 'filtered'] })
    .forEach(([queryKey, data]) => {
      if (data && Array.isArray(data)) {
        queryClient.setQueryData(queryKey, updateList(data as Transaction[]));
      }
    });
};

/**
 * Selective invalidation for transaction-related computed data
 * Only invalidates queries that truly need recalculation
 */
export const invalidateTransactionComputedData = (
  queryClient: QueryClient,
  transaction: Transaction
) => {
  // Only invalidate account balance for the affected account
  queryClient.invalidateQueries({
    queryKey: queryKeys.accountBalance(transaction.account_id),
    exact: false,
  });

  // Invalidate financial summaries (lightweight queries)
  queryClient.invalidateQueries({
    queryKey: [...queryKeys.transactions(), 'summary'],
    exact: false,
  });

  // Invalidate dashboard data (composite view)
  queryClient.invalidateQueries({
    queryKey: queryKeys.dashboardData(transaction.user_id),
    exact: true,
  });

  // Only invalidate if transaction affects budgets
  if (transaction.type === 'expense') {
    queryClient.invalidateQueries({
      queryKey: [...queryKeys.budget(''), 'performance'],
      exact: false,
    });
  }
};

/**
 * Smart cache update for budgets
 * Updates all relevant caches without triggering refetches
 */
export const updateBudgetInCache = (
  queryClient: QueryClient,
  budget: Budget,
  operation: 'create' | 'update' | 'delete'
) => {
  const updateList = (list: Budget[] | undefined): Budget[] => {
    if (!list) return operation === 'create' ? [budget] : [];

    if (operation === 'delete') {
      return list.filter(b => b.id !== budget.id);
    }

    if (operation === 'update') {
      const exists = list.some(b => b.id === budget.id);
      return exists
        ? list.map(b => b.id === budget.id ? budget : b)
        : list;
    }

    if (operation === 'create') {
      return [...list, budget];
    }

    return list;
  };

  // Update main budgets cache
  queryClient.setQueryData(queryKeys.budgets(), updateList);

  // Update user-specific budget cache
  queryClient.setQueryData(
    queryKeys.budgetsByUser(budget.user_id),
    updateList
  );

  // Update individual budget cache
  if (operation === 'delete') {
    queryClient.removeQueries({ queryKey: queryKeys.budget(budget.id) });
  } else {
    queryClient.setQueryData(queryKeys.budget(budget.id), budget);
  }
};

/**
 * Selective invalidation for budget-related computed data
 */
export const invalidateBudgetComputedData = (
  queryClient: QueryClient,
  budget: Budget
) => {
  // Invalidate budget analysis and performance
  queryClient.invalidateQueries({
    queryKey: [...queryKeys.budget(budget.id), 'performance'],
    exact: false,
  });

  queryClient.invalidateQueries({
    queryKey: [...queryKeys.budget(budget.id), 'analysis'],
    exact: false,
  });

  // Invalidate budget status queries
  queryClient.invalidateQueries({
    queryKey: [...queryKeys.budgetsByUser(budget.user_id), 'with-status'],
    exact: true,
  });

  // Invalidate dashboard budget data
  queryClient.invalidateQueries({
    queryKey: queryKeys.budgetData(budget.user_id),
    exact: true,
  });
};

/**
 * Smart cache update for budget periods
 */
export const updateBudgetPeriodInCache = (
  queryClient: QueryClient,
  budgetPeriod: BudgetPeriod,
  operation: 'create' | 'update' | 'delete'
) => {
  const updateList = (list: BudgetPeriod[] | undefined): BudgetPeriod[] => {
    if (!list) return operation === 'create' ? [budgetPeriod] : [];

    if (operation === 'delete') {
      return list.filter(bp => bp.id !== budgetPeriod.id);
    }

    if (operation === 'update') {
      const exists = list.some(bp => bp.id === budgetPeriod.id);
      return exists
        ? list.map(bp => bp.id === budgetPeriod.id ? budgetPeriod : bp)
        : list;
    }

    if (operation === 'create') {
      return [...list, budgetPeriod];
    }

    return list;
  };

  // Update main budget periods cache
  queryClient.setQueryData(queryKeys.budgetPeriods(), updateList);

  // Update user-specific budget period cache
  queryClient.setQueryData(
    queryKeys.budgetPeriodsByUser(budgetPeriod.user_id),
    updateList
  );

  // Update individual budget period cache
  if (operation === 'delete') {
    queryClient.removeQueries({ queryKey: queryKeys.budgetPeriod(budgetPeriod.id) });
  } else {
    queryClient.setQueryData(queryKeys.budgetPeriod(budgetPeriod.id), budgetPeriod);
  }

  // Invalidate active periods (computed query)
  queryClient.invalidateQueries({
    queryKey: queryKeys.activeBudgetPeriods(budgetPeriod.user_id),
    exact: false,
  });
};

/**
 * Optimistic update helper for mutations
 * Returns snapshot for rollback on error
 */
export const createOptimisticSnapshot = <T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[]
): T | undefined => {
  return queryClient.getQueryData<T>(queryKey);
};

/**
 * Rollback helper for failed optimistic updates
 */
export const rollbackOptimisticUpdate = <T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  snapshot: T | undefined
) => {
  if (snapshot !== undefined) {
    queryClient.setQueryData(queryKey, snapshot);
  }
};

/**
 * Batch invalidation for multiple related queries
 * More efficient than individual invalidations
 */
export const batchInvalidate = (
  queryClient: QueryClient,
  queryKeys: Array<readonly unknown[]>
) => {
  queryKeys.forEach(key => {
    queryClient.invalidateQueries({ queryKey: key, exact: false });
  });
};
