'use client';

import {
  accountService,
  apiHelpers,
  budgetPeriodService,
  budgetService,
  categoryService,
  investmentService,
  transactionService,
  userService,
} from '@/lib/api-client';
import { QUERY_STALE_TIMES } from '@/lib/query-config';
import { queryKeys, queryKeyUtils } from '@/lib/query-keys';
import type {
  EnhancedHolding,
  PortfolioData,
  Transaction,
} from '@/lib/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * User-related query hooks
 */
export const useUsers = () => {
  return useQuery({
    queryKey: queryKeys.users(),
    queryFn: userService.getAll,
    staleTime: QUERY_STALE_TIMES.users,
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => userService.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIMES.users,
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: [...queryKeys.users(), 'current'],
    queryFn: apiHelpers.getCurrentUser,
    staleTime: QUERY_STALE_TIMES.users,
  });
};

/**
 * Account-related query hooks
 */
export const useAccounts = () => {
  return useQuery({
    queryKey: queryKeys.accounts(),
    queryFn: accountService.getAll,
    staleTime: QUERY_STALE_TIMES.accounts,
  });
};

export const useAccountsByUser = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.accountsByUser(userId),
    queryFn: () => accountService.getByUserId(userId),
    enabled: !!userId,
    staleTime: QUERY_STALE_TIMES.accounts,
  });
};

export const useAccount = (id: string) => {
  return useQuery({
    queryKey: queryKeys.account(id),
    queryFn: () => accountService.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIMES.accounts,
  });
};

/**
 * Transaction-related query hooks
 */
export const useTransactions = () => {
  return useQuery({
    queryKey: queryKeys.transactions(),
    queryFn: transactionService.getAll,
    staleTime: QUERY_STALE_TIMES.transactions,
  });
};

export const useTransactionsByUser = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.transactionsByUser(userId),
    queryFn: () => transactionService.getByUserId(userId),
    enabled: !!userId,
    staleTime: QUERY_STALE_TIMES.transactions,
  });
};

export const useTransactionsByAccount = (accountId: string) => {
  return useQuery({
    queryKey: queryKeys.transactionsByAccount(accountId),
    queryFn: () => transactionService.getByAccountId(accountId),
    enabled: !!accountId,
    staleTime: QUERY_STALE_TIMES.transactions,
  });
};

/**
 * Hook for fetching ALL transactions including from shared accounts
 * Used for balance calculations - members need to see full balances
 * but not necessarily all transaction details in lists
 */
export const useTransactionsForBalances = () => {
  return useQuery({
    queryKey: [...queryKeys.transactions(), 'for-balances'],
    queryFn: async () => {
      const response = await fetch('/api/transactions?includeSharedAccountTransactions=true');
      if (!response.ok) {
        throw new Error('Failed to fetch transactions for balances');
      }
      const result = await response.json();
      // API returns { data: Transaction[] }, so extract the data array
      return result.data || [];
    },
    staleTime: QUERY_STALE_TIMES.transactions,
  });
};

export const useTransactionsWithFilters = (filters: Record<string, unknown>) => {
  return useQuery({
    queryKey: queryKeys.transactionsWithFilters(filters),
    queryFn: () => apiHelpers.getTransactionsWithFilters(filters),
    staleTime: 3 * 60 * 1000, // OPTIMIZED: 3 minutes - reduced refetch frequency
    // OPTIMIZED: Removed aggressive refetching - rely on optimistic updates
  });
};

/**
 * OPTIMIZED: Enhanced hook for managing filtered transactions
 * Uses client-side filtering from cache for instant responses
 */
export const useOptimizedTransactionsWithFilters = (filters: Record<string, unknown>) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.transactionsWithFilters(filters),
    queryFn: () => apiHelpers.getTransactionsWithFilters(filters),
    staleTime: 3 * 60 * 1000, // OPTIMIZED: 3 minutes instead of 30 seconds

    // Intelligent cache selection - try to derive from existing data when possible
    select: (data: Transaction[]) => {
      // Sort by date descending for consistent UI
      return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    // OPTIMIZED: Removed aggressive refetching - rely on cache and optimistic updates

    // Use initial data from cache if available (instant response)
    initialData: () => {
      // Try to get from main transactions cache and filter client-side
      const allTransactions = queryClient.getQueryData<Transaction[]>(queryKeys.transactions());
      if (!allTransactions) return undefined;

      // OPTIMIZED: Single-pass filtering - O(n) instead of O(6n)
      // Pre-compute date comparisons outside the loop
      const startDate = filters.startDate ? new Date(filters.startDate as string) : null;
      const endDate = filters.endDate ? new Date(filters.endDate as string) : null;

      const filtered = allTransactions.filter(tx => {
        // Early exit pattern - fail fast on first mismatch
        if (filters.userId && tx.user_id !== filters.userId) return false;
        if (filters.accountId && tx.account_id !== filters.accountId) return false;
        if (filters.category && tx.category !== filters.category) return false;
        if (filters.type && tx.type !== filters.type) return false;

        // Date checks with pre-computed dates
        if (startDate && new Date(tx.date) < startDate) return false;
        if (endDate && new Date(tx.date) > endDate) return false;

        return true;
      });

      return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    // Mark as stale if we used initial data
    initialDataUpdatedAt: () => {
      const queryState = queryClient.getQueryState(queryKeys.transactions());
      return queryState?.dataUpdatedAt;
    },
  });
};

export const useUpcomingTransactions = (userId?: string) => {
  return useQuery({
    queryKey: queryKeys.upcomingTransactions(userId),
    queryFn: () => transactionService.getUpcomingTransactions(userId),
    staleTime: QUERY_STALE_TIMES.upcomingTransactions,
  });
};

// New advanced transaction hooks
export const useFinancialSummary = (userId?: string, dateRange?: { start: string; end: string }) => {
  return useQuery({
    queryKey: [...queryKeys.transactions(), 'summary', userId, dateRange].filter(Boolean),
    queryFn: () => transactionService.getFinancialSummary(userId, dateRange),
    staleTime: QUERY_STALE_TIMES.financialSummary,
  });
};

export const useSpendingTrends = (userId?: string, days: number = 30) => {
  return useQuery({
    queryKey: [...queryKeys.transactions(), 'trends', userId, days],
    queryFn: () => transactionService.getSpendingTrends(userId, days),
    staleTime: QUERY_STALE_TIMES.spendingTrends,
  });
};

/**
 * Budget-related query hooks
 */
export const useBudgets = () => {
  return useQuery({
    queryKey: queryKeys.budgets(),
    queryFn: budgetService.getAll,
    staleTime: QUERY_STALE_TIMES.budgets,
  });
};

export const useBudgetsByUser = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.budgetsByUser(userId),
    queryFn: () => budgetService.getByUserId(userId),
    enabled: !!userId,
    staleTime: QUERY_STALE_TIMES.budgets,
  });
};

export const useBudget = (id: string) => {
  return useQuery({
    queryKey: queryKeys.budget(id),
    queryFn: () => budgetService.getById(id),
    enabled: !!id,
    staleTime: QUERY_STALE_TIMES.budgets,
  });
};

export const useBudgetPeriods = () => {
  return useQuery({
    queryKey: queryKeys.budgetPeriods(),
    queryFn: budgetPeriodService.getAll,
    staleTime: QUERY_STALE_TIMES.budgetPeriods,
  });
};

export const useBudgetPeriodsByUser = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.budgetPeriodsByUser(userId),
    queryFn: () => budgetPeriodService.getByUserId(userId),
    enabled: !!userId,
    staleTime: QUERY_STALE_TIMES.budgetPeriods,
  });
};

export const useActiveBudgetPeriods = (userId?: string) => {
  return useQuery({
    queryKey: queryKeys.activeBudgetPeriods(userId),
    queryFn: () => budgetPeriodService.getActivePeriods(userId!),
    enabled: !!userId,
    staleTime: QUERY_STALE_TIMES.budgetPeriods,
  });
};

export const useCurrentBudgetPeriod = (budgetId: string) => {
  return useQuery({
    queryKey: queryKeys.currentBudgetPeriod(budgetId),
    queryFn: () => budgetPeriodService.getCurrentPeriod(budgetId),
    enabled: !!budgetId,
    staleTime: QUERY_STALE_TIMES.budgetPeriods,
  });
};

// New advanced budget hooks
export const useBudgetAnalysis = (budgetId: string) => {
  return useQuery({
    queryKey: [...queryKeys.budget(budgetId), 'analysis'],
    queryFn: () => budgetService.getBudgetAnalysis(budgetId),
    enabled: !!budgetId,
    staleTime: QUERY_STALE_TIMES.budgetAnalysis,
  });
};

export const useBudgetsWithStatus = (userId: string) => {
  return useQuery({
    queryKey: [...queryKeys.budgetsByUser(userId), 'with-status'],
    queryFn: () => budgetService.getBudgetsByUserWithStatus(userId),
    enabled: !!userId,
    staleTime: QUERY_STALE_TIMES.budgets,
  });
};

/**
 * Category-related query hooks (reference data)
 */
export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: categoryService.getAll,
    staleTime: QUERY_STALE_TIMES.categories,
  });
};

/**
 * Cache invalidation utilities for transaction operations
 */
export const transactionCacheUtils = {
  /**
   * Invalidate all caches related to a specific transaction
   */
  invalidateTransactionCaches: (queryClient: ReturnType<typeof useQueryClient>, transaction: Transaction) => {
    // Individual transaction
    queryClient.removeQueries({ queryKey: queryKeys.transaction(transaction.id) });

    // Transaction lists
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
    queryClient.invalidateQueries({ queryKey: queryKeys.transactionsByUser(transaction.user_id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.transactionsByAccount(transaction.account_id) });

    // Filtered queries
    queryClient.invalidateQueries({ queryKey: [...queryKeys.transactions(), 'filtered'] });

    // Financial aggregations
    const invalidationKeys = queryKeyUtils.invalidateAfterTransaction(transaction);
    invalidationKeys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: key });
    });

    // Recurring series if applicable
    if (transaction.frequency && transaction.frequency !== 'once') {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurringSeries() });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeRecurringSeries(transaction.user_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeRecurringSeries() });
    }

    // Dashboard and upcoming transactions
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    queryClient.invalidateQueries({ queryKey: queryKeys.upcomingTransactions() });
    queryClient.invalidateQueries({ queryKey: queryKeys.upcomingTransactions(transaction.user_id) });
  },

  /**
   * Update transaction in all relevant caches
   */
  updateTransactionInCaches: (queryClient: ReturnType<typeof useQueryClient>, transaction: Transaction) => {
    const updateInList = (list: Transaction[] | undefined) => {
      if (!list) return [transaction];
      const existingIndex = list.findIndex(tx => tx.id === transaction.id);
      if (existingIndex >= 0) {
        const updated = [...list];
        updated[existingIndex] = transaction;
        return updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      return [transaction, ...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    // Update individual transaction cache
    queryClient.setQueryData(queryKeys.transaction(transaction.id), transaction);

    // Update transaction lists
    queryClient.setQueryData(queryKeys.transactions(), updateInList);
    queryClient.setQueryData(queryKeys.transactionsByUser(transaction.user_id), updateInList);
    queryClient.setQueryData(queryKeys.transactionsByAccount(transaction.account_id), updateInList);

    // Update filtered queries
    queryClient.getQueriesData({ queryKey: [...queryKeys.transactions(), 'filtered'] })
      .forEach(([queryKey, data]) => {
        if (data && Array.isArray(data)) {
          queryClient.setQueryData(queryKey, updateInList(data as Transaction[]));
        }
      });
  },

  /**
   * Remove transaction from all caches
   */
  removeTransactionFromCaches: (queryClient: ReturnType<typeof useQueryClient>, transactionId: string, transaction?: Transaction) => {
    const removeFromList = (list: Transaction[] | undefined) => {
      if (!list) return [];
      return list.filter(tx => tx.id !== transactionId);
    };

    // Remove individual transaction cache
    queryClient.removeQueries({ queryKey: queryKeys.transaction(transactionId) });

    // Remove from transaction lists
    queryClient.setQueryData(queryKeys.transactions(), removeFromList);

    if (transaction) {
      queryClient.setQueryData(queryKeys.transactionsByUser(transaction.user_id), removeFromList);
      queryClient.setQueryData(queryKeys.transactionsByAccount(transaction.account_id), removeFromList);
    }

    // Remove from filtered queries
    queryClient.getQueriesData({ queryKey: [...queryKeys.transactions(), 'filtered'] })
      .forEach(([queryKey, data]) => {
        if (data && Array.isArray(data)) {
          queryClient.setQueryData(queryKey, removeFromList(data as Transaction[]));
        }
      });
  },
};

/**
 * Investment-related query hooks
 */
export const useInvestments = () => {
  return useQuery({
    queryKey: queryKeys.investments(),
    queryFn: investmentService.getAll,
    staleTime: QUERY_STALE_TIMES.investments,
  });
};

export const useInvestmentsByUser = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.investmentsByUser(userId),
    queryFn: () => investmentService.getByUserId(),
    enabled: !!userId,
    staleTime: QUERY_STALE_TIMES.investments,
  });
};

export const usePortfolioData = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.portfolioData(userId),
    queryFn: async (): Promise<PortfolioData> => {
      const holdings = await investmentService.getByUserId();

      // Calculate enhanced portfolio data
      const enhancedHoldings: EnhancedHolding[] = holdings.map((holding) => {
        const currentValue = holding.quantity * holding.current_price;
        const purchaseValue = holding.quantity * holding.purchase_price;
        const gainLoss = currentValue - purchaseValue;
        const gainLossPercent = purchaseValue > 0 ? (gainLoss / purchaseValue) * 100 : 0;

        return {
          ...holding,
          currentValue,
          gainLoss,
          gainLossPercent,
        };
      });

      const totalValue = enhancedHoldings.reduce((sum, holding) => sum + holding.currentValue, 0);
      const totalGainLoss = enhancedHoldings.reduce((sum, holding) => sum + holding.gainLoss, 0);
      const totalPurchaseValue = enhancedHoldings.reduce(
        (sum, holding) => sum + (holding.quantity * holding.purchase_price), 0
      );
      const gainLossPercent = totalPurchaseValue > 0 ? (totalGainLoss / totalPurchaseValue) * 100 : 0;

      return {
        totalValue,
        gainLoss: totalGainLoss,
        gainLossPercent,
        holdings: enhancedHoldings,
      };
    },
    enabled: !!userId,
    staleTime: QUERY_STALE_TIMES.portfolioData,
  });
};

/**
 * Mutation hooks for financial operations
 */

/**
 * Mutation hooks for financial operations
 * NOTE: Transaction and Budget mutations have been moved to dedicated optimized hooks:
 * - useCreateTransaction, useUpdateTransaction, useDeleteTransaction -> /hooks/use-transaction-mutations.ts
 * - useCreateBudget, useUpdateBudget, useDeleteBudget -> /hooks/use-budget-mutations.ts
 * - useCreateBudgetPeriod, useUpdateBudgetPeriod, useStartBudgetPeriod, useEndBudgetPeriod -> /hooks/use-budget-mutations.ts
 */
