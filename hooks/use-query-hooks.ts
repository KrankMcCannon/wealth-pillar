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
import { queryKeys, queryKeyUtils } from '@/lib/query-keys';
import type {
  Budget,
  BudgetPeriod,
  EnhancedHolding,
  PortfolioData,
  Transaction,
} from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * User-related query hooks
 */
export const useUsers = () => {
  return useQuery({
    queryKey: queryKeys.users(),
    queryFn: userService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes - users don't change often
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => userService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: [...queryKeys.users(), 'current'],
    queryFn: apiHelpers.getCurrentUser,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Account-related query hooks
 */
export const useAccounts = () => {
  return useQuery({
    queryKey: queryKeys.accounts(),
    queryFn: accountService.getAll,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useAccountsByUser = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.accountsByUser(userId),
    queryFn: () => accountService.getByUserId(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useAccount = (id: string) => {
  return useQuery({
    queryKey: queryKeys.account(id),
    queryFn: () => accountService.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Transaction-related query hooks
 */
export const useTransactions = () => {
  return useQuery({
    queryKey: queryKeys.transactions(),
    queryFn: transactionService.getAll,
    staleTime: 30 * 1000, // 30 seconds - financial data should be fresh
  });
};

export const useTransactionsByUser = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.transactionsByUser(userId),
    queryFn: () => transactionService.getByUserId(userId),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
};

export const useTransactionsByAccount = (accountId: string) => {
  return useQuery({
    queryKey: queryKeys.transactionsByAccount(accountId),
    queryFn: () => transactionService.getByAccountId(accountId),
    enabled: !!accountId,
    staleTime: 30 * 1000,
  });
};

export const useTransactionsWithFilters = (filters: Record<string, unknown>) => {
  return useQuery({
    queryKey: queryKeys.transactionsWithFilters(filters),
    queryFn: () => apiHelpers.getTransactionsWithFilters(filters),
    staleTime: 30 * 1000,
    // Enable background refetching for financial data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
};

/**
 * Enhanced hook for managing filtered transactions with real-time updates
 * Automatically keeps filtered data in sync with optimistic updates
 */
export const useOptimizedTransactionsWithFilters = (filters: Record<string, unknown>) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.transactionsWithFilters(filters),
    queryFn: () => apiHelpers.getTransactionsWithFilters(filters),
    staleTime: 30 * 1000,

    // Intelligent cache selection - try to derive from existing data when possible
    select: (data: Transaction[]) => {
      // Sort by date descending for consistent UI
      return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    // Keep data fresh for financial information
    refetchOnWindowFocus: true,
    refetchOnMount: true,

    // Use initial data from cache if available
    initialData: () => {
      // Try to get from main transactions cache and filter client-side
      const allTransactions = queryClient.getQueryData<Transaction[]>(queryKeys.transactions());
      if (!allTransactions) return undefined;

      // Apply basic filters client-side for immediate response
      let filtered = allTransactions;

      if (filters.userId) {
        filtered = filtered.filter(tx => tx.user_id === filters.userId);
      }
      if (filters.accountId) {
        filtered = filtered.filter(tx => tx.account_id === filters.accountId);
      }
      if (filters.category) {
        filtered = filtered.filter(tx => tx.category === filters.category);
      }
      if (filters.type) {
        filtered = filtered.filter(tx => tx.type === filters.type);
      }
      if (filters.startDate) {
        filtered = filtered.filter(tx => new Date(tx.date) >= new Date(filters.startDate as string));
      }
      if (filters.endDate) {
        filtered = filtered.filter(tx => new Date(tx.date) <= new Date(filters.endDate as string));
      }

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
    staleTime: 2 * 60 * 1000, // 2 minutes for upcoming transactions
  });
};

// New advanced transaction hooks
export const useFinancialSummary = (userId?: string, dateRange?: { start: string; end: string }) => {
  return useQuery({
    queryKey: [...queryKeys.transactions(), 'summary', userId, dateRange].filter(Boolean),
    queryFn: () => transactionService.getFinancialSummary(userId, dateRange),
    staleTime: 60 * 1000, // 1 minute
  });
};

export const useSpendingTrends = (userId?: string, days: number = 30) => {
  return useQuery({
    queryKey: [...queryKeys.transactions(), 'trends', userId, days],
    queryFn: () => transactionService.getSpendingTrends(userId, days),
    staleTime: 60 * 1000, // 1 minute
  });
};

/**
 * Budget-related query hooks
 */
export const useBudgets = () => {
  return useQuery({
    queryKey: queryKeys.budgets(),
    queryFn: budgetService.getAll,
    staleTime: 2 * 60 * 1000,
  });
};

export const useBudgetsByUser = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.budgetsByUser(userId),
    queryFn: () => budgetService.getByUserId(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useBudget = (id: string) => {
  return useQuery({
    queryKey: queryKeys.budget(id),
    queryFn: () => budgetService.getById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export const useBudgetPeriods = () => {
  return useQuery({
    queryKey: queryKeys.budgetPeriods(),
    queryFn: budgetPeriodService.getAll,
    staleTime: 1 * 60 * 1000, // 1 minute for budget periods
  });
};

export const useBudgetPeriodsByUser = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.budgetPeriodsByUser(userId),
    queryFn: () => budgetPeriodService.getByUserId(userId),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000,
  });
};

export const useActiveBudgetPeriods = (userId?: string) => {
  return useQuery({
    queryKey: queryKeys.activeBudgetPeriods(userId),
    queryFn: () => budgetPeriodService.getActivePeriods(userId!),
    enabled: !!userId,
    staleTime: 1 * 60 * 1000,
  });
};

export const useCurrentBudgetPeriod = (budgetId: string) => {
  return useQuery({
    queryKey: queryKeys.currentBudgetPeriod(budgetId),
    queryFn: () => budgetPeriodService.getCurrentPeriod(budgetId),
    enabled: !!budgetId,
    staleTime: 1 * 60 * 1000,
  });
};

// New advanced budget hooks
export const useBudgetAnalysis = (budgetId: string) => {
  return useQuery({
    queryKey: [...queryKeys.budget(budgetId), 'analysis'],
    queryFn: () => budgetService.getBudgetAnalysis(budgetId),
    enabled: !!budgetId,
    staleTime: 30 * 1000, // 30 seconds for budget analysis
  });
};

export const useBudgetsWithStatus = (userId: string) => {
  return useQuery({
    queryKey: [...queryKeys.budgetsByUser(userId), 'with-status'],
    queryFn: () => budgetService.getBudgetsByUserWithStatus(userId),
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
  });
};

/**
 * Category-related query hooks (reference data)
 */
export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.categories(),
    queryFn: categoryService.getAll,
    staleTime: 10 * 60 * 1000, // 10 minutes - categories rarely change
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
    staleTime: 2 * 60 * 1000,
  });
};

export const useInvestmentsByUser = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.investmentsByUser(userId),
    queryFn: () => investmentService.getByUserId(),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
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
    staleTime: 1 * 60 * 1000, // 1 minute for investment data
  });
};

/**
 * Mutation hooks for financial operations
 */
export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionService.create,

    // Optimistic update for immediate UI response
    onMutate: async (newTransactionData) => {
      // Cancel outgoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions() });
      await queryClient.cancelQueries({ queryKey: queryKeys.transactionsByUser(newTransactionData.user_id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.transactionsByAccount(newTransactionData.account_id) });

      // Snapshot previous values for rollback
      const previousTransactions = queryClient.getQueryData<Transaction[]>(queryKeys.transactions());
      const previousUserTransactions = queryClient.getQueryData<Transaction[]>(
        queryKeys.transactionsByUser(newTransactionData.user_id)
      );
      const previousAccountTransactions = queryClient.getQueryData<Transaction[]>(
        queryKeys.transactionsByAccount(newTransactionData.account_id)
      );

      // Create optimistic transaction with temporary ID
      const optimisticTransaction: Transaction = {
        ...newTransactionData,
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Transaction;

      // Helper function to add transaction to sorted list
      const addToSortedList = (list: Transaction[] | undefined) => {
        if (!list) return [optimisticTransaction];
        return [optimisticTransaction, ...list].sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      };

      // Apply optimistic updates to all relevant caches
      queryClient.setQueryData(queryKeys.transactions(), addToSortedList(previousTransactions));
      queryClient.setQueryData(
        queryKeys.transactionsByUser(newTransactionData.user_id),
        addToSortedList(previousUserTransactions)
      );
      queryClient.setQueryData(
        queryKeys.transactionsByAccount(newTransactionData.account_id),
        addToSortedList(previousAccountTransactions)
      );

      // Update filtered queries if they exist in cache
      queryClient.getQueriesData({ queryKey: [...queryKeys.transactions(), 'filtered'] })
        .forEach(([queryKey, data]) => {
          if (data && Array.isArray(data)) {
            queryClient.setQueryData(queryKey, addToSortedList(data as Transaction[]));
          }
        });

      return {
        previousTransactions,
        previousUserTransactions,
        previousAccountTransactions,
        optimisticTransaction,
      };
    },

    onError: (err, variables, context) => {
      // Rollback all optimistic updates on error
      if (context?.previousTransactions) {
        queryClient.setQueryData(queryKeys.transactions(), context.previousTransactions);
      }
      if (context?.previousUserTransactions) {
        queryClient.setQueryData(
          queryKeys.transactionsByUser(variables.user_id),
          context.previousUserTransactions
        );
      }
      if (context?.previousAccountTransactions) {
        queryClient.setQueryData(
          queryKeys.transactionsByAccount(variables.account_id),
          context.previousAccountTransactions
        );
      }

      // Rollback filtered queries
      queryClient.getQueriesData({ queryKey: [...queryKeys.transactions(), 'filtered'] })
        .forEach(([queryKey]) => {
          queryClient.invalidateQueries({ queryKey });
        });
    },
    onSuccess: (newTransaction, variables, context) => {
      // Helper function to replace optimistic transaction with real data
      const replaceOptimisticTransaction = (list: Transaction[] | undefined) => {
        if (!list) return [newTransaction];

        // Remove the optimistic transaction and add the real one
        const withoutOptimistic = list.filter(tx =>
          !tx.id.startsWith('temp-') || tx.id !== context?.optimisticTransaction?.id
        );

        // Check if real transaction already exists (avoid duplicates)
        const existingIndex = withoutOptimistic.findIndex(tx => tx.id === newTransaction.id);
        if (existingIndex >= 0) {
          withoutOptimistic[existingIndex] = newTransaction;
          return withoutOptimistic.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }

        return [newTransaction, ...withoutOptimistic].sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      };

      // Update all transaction caches with real data
      queryClient.setQueryData(queryKeys.transactions(), replaceOptimisticTransaction);
      queryClient.setQueryData(
        queryKeys.transactionsByUser(newTransaction.user_id),
        replaceOptimisticTransaction
      );
      queryClient.setQueryData(
        queryKeys.transactionsByAccount(newTransaction.account_id),
        replaceOptimisticTransaction
      );

      // Update individual transaction cache
      queryClient.setQueryData(queryKeys.transaction(newTransaction.id), newTransaction);

      // Update filtered queries
      queryClient.getQueriesData({ queryKey: [...queryKeys.transactions(), 'filtered'] })
        .forEach(([queryKey, data]) => {
          if (data && Array.isArray(data)) {
            queryClient.setQueryData(queryKey, replaceOptimisticTransaction(data as Transaction[]));
          }
        });

      // Invalidate aggregated and dashboard queries for consistency
      const invalidationKeys = queryKeyUtils.invalidateAfterTransaction(newTransaction);
      invalidationKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });

      // Handle recurring transactions - invalidate recurring series queries
      if (newTransaction.frequency && newTransaction.frequency !== 'once') {
        queryClient.invalidateQueries({ queryKey: queryKeys.recurringSeries() });
        queryClient.invalidateQueries({ queryKey: queryKeys.activeRecurringSeries(newTransaction.user_id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.activeRecurringSeries() });
      }

      // Invalidate upcoming transactions if this affects future dates
      queryClient.invalidateQueries({ queryKey: queryKeys.upcomingTransactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.upcomingTransactions(newTransaction.user_id) });
    },

    onSettled: () => {
      // Ensure fresh data on next request regardless of success/error
      queryClient.invalidateQueries({ queryKey: queryKeys.financial() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Transaction> }) =>
      transactionService.update(id, data),

    // Comprehensive optimistic update for immediate UI response
    onMutate: async ({ id, data }) => {
      // Get the current transaction to know which caches to update
      const currentTransaction = queryClient.getQueryData<Transaction>(queryKeys.transaction(id));
      const currentTransactions = queryClient.getQueryData<Transaction[]>(queryKeys.transactions());
      const originalTransaction = currentTransactions?.find(tx => tx.id === id) || currentTransaction;

      if (!originalTransaction) {
        // If we don't have the original transaction, we can't do optimistic updates safely
        return { previousData: null };
      }

      // Cancel outgoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions() });
      await queryClient.cancelQueries({ queryKey: queryKeys.transaction(id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.transactionsByUser(originalTransaction.user_id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.transactionsByAccount(originalTransaction.account_id) });

      // If the update changes user_id or account_id, we need to handle moving between caches
      const newUserId = data.user_id || originalTransaction.user_id;
      const newAccountId = data.account_id || originalTransaction.account_id;
      const userChanged = newUserId !== originalTransaction.user_id;
      const accountChanged = newAccountId !== originalTransaction.account_id;

      if (userChanged) {
        await queryClient.cancelQueries({ queryKey: queryKeys.transactionsByUser(newUserId) });
      }
      if (accountChanged) {
        await queryClient.cancelQueries({ queryKey: queryKeys.transactionsByAccount(newAccountId) });
      }

      // Snapshot previous values for rollback
      const previousTransactions = queryClient.getQueryData<Transaction[]>(queryKeys.transactions());
      const previousUserTransactions = queryClient.getQueryData<Transaction[]>(
        queryKeys.transactionsByUser(originalTransaction.user_id)
      );
      const previousAccountTransactions = queryClient.getQueryData<Transaction[]>(
        queryKeys.transactionsByAccount(originalTransaction.account_id)
      );
      const previousNewUserTransactions = userChanged ? queryClient.getQueryData<Transaction[]>(
        queryKeys.transactionsByUser(newUserId)
      ) : null;
      const previousNewAccountTransactions = accountChanged ? queryClient.getQueryData<Transaction[]>(
        queryKeys.transactionsByAccount(newAccountId)
      ) : null;

      // Create optimistically updated transaction
      const optimisticTransaction: Transaction = {
        ...originalTransaction,
        ...data,
        updated_at: new Date().toISOString(),
      };

      // Helper function to update transaction in list
      const updateInList = (list: Transaction[] | undefined) => {
        if (!list) return [];
        return list
          .map(tx => tx.id === id ? optimisticTransaction : tx)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      };

      // Helper function to remove transaction from list
      const removeFromList = (list: Transaction[] | undefined) => {
        if (!list) return [];
        return list.filter(tx => tx.id !== id);
      };

      // Helper function to add transaction to list
      const addToList = (list: Transaction[] | undefined) => {
        if (!list) return [optimisticTransaction];
        return [optimisticTransaction, ...list]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      };

      // Update main transactions list
      queryClient.setQueryData(queryKeys.transactions(), updateInList(previousTransactions));

      // Update individual transaction cache
      queryClient.setQueryData(queryKeys.transaction(id), optimisticTransaction);

      // Update user-specific transactions
      if (userChanged) {
        // Remove from old user's list
        queryClient.setQueryData(
          queryKeys.transactionsByUser(originalTransaction.user_id),
          removeFromList(previousUserTransactions)
        );
        // Add to new user's list
        queryClient.setQueryData(
          queryKeys.transactionsByUser(newUserId),
          addToList(previousNewUserTransactions || undefined)
        );
      } else {
        // Update in same user's list
        queryClient.setQueryData(
          queryKeys.transactionsByUser(originalTransaction.user_id),
          updateInList(previousUserTransactions)
        );
      }

      // Update account-specific transactions
      if (accountChanged) {
        // Remove from old account's list
        queryClient.setQueryData(
          queryKeys.transactionsByAccount(originalTransaction.account_id),
          removeFromList(previousAccountTransactions)
        );
        // Add to new account's list
        queryClient.setQueryData(
          queryKeys.transactionsByAccount(newAccountId),
          addToList(previousNewAccountTransactions || undefined)
        );
      } else {
        // Update in same account's list
        queryClient.setQueryData(
          queryKeys.transactionsByAccount(originalTransaction.account_id),
          updateInList(previousAccountTransactions)
        );
      }

      // Update filtered queries
      queryClient.getQueriesData({ queryKey: [...queryKeys.transactions(), 'filtered'] })
        .forEach(([queryKey, data]) => {
          if (data && Array.isArray(data)) {
            queryClient.setQueryData(queryKey, updateInList(data as Transaction[]));
          }
        });

      return {
        previousTransactions,
        previousUserTransactions,
        previousAccountTransactions,
        previousNewUserTransactions,
        previousNewAccountTransactions,
        originalTransaction,
        userChanged,
        accountChanged,
        newUserId,
        newAccountId,
      };
    },

    // Rollback optimistic updates on error
    onError: (err, variables, context) => {
      if (!context || context.previousData === null) return;

      const { id } = variables;
      const {
        previousTransactions,
        previousUserTransactions,
        previousAccountTransactions,
        previousNewUserTransactions,
        previousNewAccountTransactions,
        originalTransaction,
        userChanged,
        accountChanged,
        newUserId,
        newAccountId,
      } = context;

      // Rollback all cache updates
      if (previousTransactions) {
        queryClient.setQueryData(queryKeys.transactions(), previousTransactions);
      }

      if (originalTransaction) {
        queryClient.setQueryData(queryKeys.transaction(id), originalTransaction);

        if (previousUserTransactions) {
          queryClient.setQueryData(
            queryKeys.transactionsByUser(originalTransaction.user_id),
            previousUserTransactions
          );
        }

        if (previousAccountTransactions) {
          queryClient.setQueryData(
            queryKeys.transactionsByAccount(originalTransaction.account_id),
            previousAccountTransactions
          );
        }

        if (userChanged && previousNewUserTransactions) {
          queryClient.setQueryData(
            queryKeys.transactionsByUser(newUserId),
            previousNewUserTransactions
          );
        }

        if (accountChanged && previousNewAccountTransactions) {
          queryClient.setQueryData(
            queryKeys.transactionsByAccount(newAccountId),
            previousNewAccountTransactions
          );
        }
      }

      // Rollback filtered queries by invalidating them
      queryClient.getQueriesData({ queryKey: [...queryKeys.transactions(), 'filtered'] })
        .forEach(([queryKey]) => {
          queryClient.invalidateQueries({ queryKey });
        });
    },
    onSuccess: (updatedTransaction, variables, context) => {
      if (!context || context.previousData === null) {
        // Fallback: if we couldn't do optimistic updates, update caches now
        queryClient.setQueryData(queryKeys.transaction(updatedTransaction.id), updatedTransaction);
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
        queryClient.invalidateQueries({ queryKey: queryKeys.transactionsByUser(updatedTransaction.user_id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.transactionsByAccount(updatedTransaction.account_id) });
        return;
      }

      const { originalTransaction, userChanged, accountChanged } = context;

      // Helper function to ensure updated transaction is in list
      const ensureUpdatedInList = (list: Transaction[] | undefined) => {
        if (!list) return [updatedTransaction];
        const existingIndex = list.findIndex(tx => tx.id === updatedTransaction.id);
        if (existingIndex >= 0) {
          const updated = [...list];
          updated[existingIndex] = updatedTransaction;
          return updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        return [updatedTransaction, ...list]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      };

      // Update all caches with the real server response
      queryClient.setQueryData(queryKeys.transaction(updatedTransaction.id), updatedTransaction);
      queryClient.setQueryData(queryKeys.transactions(), ensureUpdatedInList);

      // Handle user changes
      if (userChanged && originalTransaction) {
        // Remove from old user's cache (if it wasn't optimistically updated correctly)
        queryClient.setQueryData(
          queryKeys.transactionsByUser(originalTransaction.user_id),
          (oldData: Transaction[] | undefined) => {
            if (!oldData) return [];
            return oldData.filter(tx => tx.id !== updatedTransaction.id);
          }
        );
        // Ensure it's in new user's cache
        queryClient.setQueryData(
          queryKeys.transactionsByUser(updatedTransaction.user_id),
          ensureUpdatedInList
        );
      } else {
        // Update in same user's cache
        queryClient.setQueryData(
          queryKeys.transactionsByUser(updatedTransaction.user_id),
          ensureUpdatedInList
        );
      }

      // Handle account changes
      if (accountChanged && originalTransaction) {
        // Remove from old account's cache
        queryClient.setQueryData(
          queryKeys.transactionsByAccount(originalTransaction.account_id),
          (oldData: Transaction[] | undefined) => {
            if (!oldData) return [];
            return oldData.filter(tx => tx.id !== updatedTransaction.id);
          }
        );
        // Ensure it's in new account's cache
        queryClient.setQueryData(
          queryKeys.transactionsByAccount(updatedTransaction.account_id),
          ensureUpdatedInList
        );
      } else {
        // Update in same account's cache
        queryClient.setQueryData(
          queryKeys.transactionsByAccount(updatedTransaction.account_id),
          ensureUpdatedInList
        );
      }

      // Update filtered queries
      queryClient.getQueriesData({ queryKey: [...queryKeys.transactions(), 'filtered'] })
        .forEach(([queryKey, data]) => {
          if (data && Array.isArray(data)) {
            queryClient.setQueryData(queryKey, ensureUpdatedInList(data as Transaction[]));
          }
        });

      // Invalidate aggregated queries for consistency
      const invalidationKeys = queryKeyUtils.invalidateAfterTransaction(updatedTransaction);
      invalidationKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });

      // Handle recurring transaction updates
      if (updatedTransaction.frequency && updatedTransaction.frequency !== 'once') {
        queryClient.invalidateQueries({ queryKey: queryKeys.recurringSeries() });
        queryClient.invalidateQueries({ queryKey: queryKeys.activeRecurringSeries(updatedTransaction.user_id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.activeRecurringSeries() });
      }

      // If the update changed the user or account, invalidate additional related queries
      if (userChanged && originalTransaction) {
        const oldInvalidationKeys = queryKeyUtils.invalidateAfterTransaction(originalTransaction);
        oldInvalidationKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }

      // Invalidate upcoming transactions
      queryClient.invalidateQueries({ queryKey: queryKeys.upcomingTransactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.upcomingTransactions(updatedTransaction.user_id) });
    },

    onSettled: () => {
      // Ensure fresh data on next request
      queryClient.invalidateQueries({ queryKey: queryKeys.financial() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionService.delete,

    // Optimistic update for immediate UI response
    onMutate: async (deletedId: string) => {
      // Get the transaction to be deleted to know which caches to update
      const transactionToDelete = queryClient.getQueryData<Transaction>(queryKeys.transaction(deletedId)) ||
        queryClient.getQueryData<Transaction[]>(queryKeys.transactions())?.find(tx => tx.id === deletedId);

      if (!transactionToDelete) {
        // If we can't find the transaction, we can't do optimistic updates safely
        return { previousData: null };
      }

      // Cancel outgoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions() });
      await queryClient.cancelQueries({ queryKey: queryKeys.transaction(deletedId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.transactionsByUser(transactionToDelete.user_id) });
      await queryClient.cancelQueries({ queryKey: queryKeys.transactionsByAccount(transactionToDelete.account_id) });

      // Snapshot previous values for rollback
      const previousTransactions = queryClient.getQueryData<Transaction[]>(queryKeys.transactions());
      const previousUserTransactions = queryClient.getQueryData<Transaction[]>(
        queryKeys.transactionsByUser(transactionToDelete.user_id)
      );
      const previousAccountTransactions = queryClient.getQueryData<Transaction[]>(
        queryKeys.transactionsByAccount(transactionToDelete.account_id)
      );
      const previousTransaction = queryClient.getQueryData<Transaction>(queryKeys.transaction(deletedId));

      // Helper function to remove transaction from list
      const removeFromList = (list: Transaction[] | undefined) => {
        if (!list) return [];
        return list.filter(tx => tx.id !== deletedId);
      };

      // Apply optimistic deletions to all relevant caches
      queryClient.setQueryData(queryKeys.transactions(), removeFromList(previousTransactions));
      queryClient.setQueryData(
        queryKeys.transactionsByUser(transactionToDelete.user_id),
        removeFromList(previousUserTransactions)
      );
      queryClient.setQueryData(
        queryKeys.transactionsByAccount(transactionToDelete.account_id),
        removeFromList(previousAccountTransactions)
      );

      // Remove from individual transaction cache
      queryClient.removeQueries({ queryKey: queryKeys.transaction(deletedId) });

      // Update filtered queries
      queryClient.getQueriesData({ queryKey: [...queryKeys.transactions(), 'filtered'] })
        .forEach(([queryKey, data]) => {
          if (data && Array.isArray(data)) {
            queryClient.setQueryData(queryKey, removeFromList(data as Transaction[]));
          }
        });

      return {
        previousTransactions,
        previousUserTransactions,
        previousAccountTransactions,
        previousTransaction,
        transactionToDelete,
      };
    },

    // Rollback optimistic updates on error
    onError: (err, deletedId, context) => {
      if (!context || context.previousData === null) return;

      const {
        previousTransactions,
        previousUserTransactions,
        previousAccountTransactions,
        previousTransaction,
        transactionToDelete,
      } = context;

      // Rollback all cache updates
      if (previousTransactions) {
        queryClient.setQueryData(queryKeys.transactions(), previousTransactions);
      }

      if (transactionToDelete) {
        if (previousUserTransactions) {
          queryClient.setQueryData(
            queryKeys.transactionsByUser(transactionToDelete.user_id),
            previousUserTransactions
          );
        }

        if (previousAccountTransactions) {
          queryClient.setQueryData(
            queryKeys.transactionsByAccount(transactionToDelete.account_id),
            previousAccountTransactions
          );
        }
      }

      if (previousTransaction) {
        queryClient.setQueryData(queryKeys.transaction(deletedId), previousTransaction);
      }

      // Rollback filtered queries by invalidating them
      queryClient.getQueriesData({ queryKey: [...queryKeys.transactions(), 'filtered'] })
        .forEach(([queryKey]) => {
          queryClient.invalidateQueries({ queryKey });
        });
    },

    onSuccess: (_, deletedId, context) => {
      // Remove from individual transaction cache (confirm deletion)
      queryClient.removeQueries({ queryKey: queryKeys.transaction(deletedId) });

      // If we had context, we already did optimistic updates
      // Just need to ensure consistency with aggregated data
      if (context && context.previousData !== null && context.transactionToDelete) {
        const { transactionToDelete } = context;

        // Invalidate aggregated queries for consistency
        const invalidationKeys = queryKeyUtils.invalidateAfterTransaction(transactionToDelete);
        invalidationKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });

        // Handle recurring transaction deletions
        if (transactionToDelete.frequency && transactionToDelete.frequency !== 'once') {
          queryClient.invalidateQueries({ queryKey: queryKeys.recurringSeries() });
          queryClient.invalidateQueries({ queryKey: queryKeys.activeRecurringSeries(transactionToDelete.user_id) });
          queryClient.invalidateQueries({ queryKey: queryKeys.activeRecurringSeries() });
        }

        // Invalidate upcoming transactions
        queryClient.invalidateQueries({ queryKey: queryKeys.upcomingTransactions() });
        queryClient.invalidateQueries({ queryKey: queryKeys.upcomingTransactions(transactionToDelete.user_id) });
      } else {
        // Fallback: if we couldn't do optimistic updates, invalidate everything
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
        queryClient.invalidateQueries({ queryKey: queryKeys.financial() });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
      }
    },

    onSettled: () => {
      // Ensure fresh data on next request
      queryClient.invalidateQueries({ queryKey: queryKeys.financial() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });
};

export const useCreateBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: budgetService.create,
    onSuccess: (data) => {
      const invalidationKeys = queryKeyUtils.invalidateAfterBudget(data);
      invalidationKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
};

export const useUpdateBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Budget> }) =>
      budgetService.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.budget(data.id), data);

      const invalidationKeys = queryKeyUtils.invalidateAfterBudget(data);
      invalidationKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
};

/**
 * Budget Period mutation hooks
 */
export const useStartBudgetPeriod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      budgetPeriodService.startNewPeriod(userId),
    onSuccess: (data) => {
      // Invalidate budget periods queries
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetPeriods() });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetPeriodsByUser(data.user_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeBudgetPeriods() });

      // Invalidate dashboard queries
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });
};

export const useEndBudgetPeriod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, endDate }: { userId: string; endDate?: string }) =>
      budgetPeriodService.endCurrentPeriod(userId, endDate),
    onSuccess: (data) => {
      // Invalidate budget periods queries
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetPeriods() });
      if (data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.budgetPeriodsByUser(data.user_id) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.activeBudgetPeriods() });

      // Invalidate dashboard queries
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });

      // Invalidate transaction-related queries as budget period changes affect calculations
      queryClient.invalidateQueries({ queryKey: queryKeys.financial() });
    },
  });
};

export const useCreateBudgetPeriod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, budgetPeriod }: {
      userId: string;
      budgetPeriod: Omit<BudgetPeriod, 'id' | 'created_at' | 'updated_at'>;
    }) => budgetPeriodService.create(userId, budgetPeriod),
    onSuccess: (data) => {
      // Invalidate budget periods queries
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetPeriods() });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetPeriodsByUser(data.user_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.activeBudgetPeriods() });
    },
  });
};

export const useUpdateBudgetPeriod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, id, data }: { userId: string; id: string; data: Partial<BudgetPeriod> }) =>
      budgetPeriodService.update(userId, id, data),
    onSuccess: (data) => {
      // Update specific budget period in cache
      queryClient.setQueryData(queryKeys.budgetPeriod(data.id), data);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetPeriods() });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgetPeriodsByUser(data.user_id) });
    },
  });
};
