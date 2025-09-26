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
    onSuccess: (data) => {
      // Invalidate relevant queries
      const invalidationKeys = queryKeyUtils.invalidateAfterTransaction(data);
      invalidationKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Transaction> }) =>
      transactionService.update(id, data),
    onSuccess: (data) => {
      // Update the specific transaction in cache
      queryClient.setQueryData(queryKeys.transaction(data.id), data);

      // Invalidate relevant queries
      const invalidationKeys = queryKeyUtils.invalidateAfterTransaction(data);
      invalidationKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionService.delete,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.transaction(deletedId) });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
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
    },
  });
};

// New bulk operations hook
export const useBulkTransactionOperations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (operations: Array<{
      type: 'create' | 'update' | 'delete';
      id?: string;
      data?: Partial<Transaction>;
    }>) => transactionService.bulkOperations(operations),
    onSuccess: () => {
      // Invalidate all transaction-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.financial() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
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
