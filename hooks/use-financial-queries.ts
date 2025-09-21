'use client';

import {
  budgetPeriodService,
  budgetService,
  transactionService,
} from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type { Transaction } from '@/lib/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Types for bulk operations
type CreateTransactionData = Omit<Transaction, 'id'>;
type UpdateTransactionData = Partial<Omit<Transaction, 'id' | 'created_at' | 'updated_at'>>;

type BulkOperation =
  | { type: 'create'; data: CreateTransactionData; id?: never }
  | { type: 'update'; data: UpdateTransactionData; id: string }
  | { type: 'delete'; data?: never; id: string };

/**
 * Financial-specific query hooks for advanced use cases
 */

/**
 * Real-time balance tracking with optimistic updates
 */
export const useAccountBalance = (accountId: string) => {
  return useQuery({
    queryKey: queryKeys.accountBalance(accountId),
    queryFn: async () => {
      const transactions = await transactionService.getAll();
      const related = transactions.filter(t => t.account_id === accountId || t.to_account_id === accountId);

      return related.reduce((sum, t) => {
        if (t.to_account_id) {
          if (t.account_id === accountId) return sum - t.amount;
          if (t.to_account_id === accountId) return sum + t.amount;
          return sum;
        }
        if (t.type === 'income') return sum + t.amount;
        if (t.type === 'expense') return sum - t.amount;
        return sum;
      }, 0);
    },
    enabled: !!accountId,
    staleTime: 15 * 1000, // 15 seconds for real-time balance
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

/**
 * Comprehensive financial summary with smart caching
 */
export const useFinancialSummary = (userId?: string, timeRange?: { start: Date; end: Date }) => {
  return useQuery({
    queryKey: [...queryKeys.financial(), 'summary', userId || 'all', timeRange],
    queryFn: async () => {
      const transactions = userId
        ? await transactionService.getByUserId(userId)
        : await transactionService.getAll();

      const filteredTransactions = timeRange
        ? transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= timeRange.start && transactionDate <= timeRange.end;
          })
        : transactions;

      const income = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const transfers = filteredTransactions
        .filter(t => t.type === 'transfer')
        .reduce((sum, t) => sum + t.amount, 0);

      const netIncome = income - expenses;
      const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

      // Category breakdown
      const categoryBreakdown = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);

      return {
        income,
        expenses,
        transfers,
        netIncome,
        savingsRate,
        categoryBreakdown,
        transactionCount: filteredTransactions.length,
        timeRange,
      };
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

/**
 * Budget performance tracking with alerts
 */
export const useBudgetPerformance = (budgetId: string) => {

  return useQuery({
    queryKey: [...queryKeys.budget(budgetId), 'performance'],
    queryFn: async () => {
      const budget = await budgetService.getById(budgetId);
      const currentPeriod = await budgetPeriodService.getCurrentPeriod(budgetId);

      if (!currentPeriod) {
        return {
          budget,
          currentPeriod: null,
          spent: 0,
          remaining: budget.amount,
          percentageUsed: 0,
          dailyAverage: 0,
          projectedSpending: 0,
          status: 'no-period' as const,
          isOverBudget: false,
          daysRemaining: 0,
        };
      }

      // Get transactions for the current period
      const transactions = await transactionService.getAll();
      const periodTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        const periodStart = new Date(currentPeriod.start_date);
        const periodEnd = currentPeriod.end_date ? new Date(currentPeriod.end_date) : new Date();

        return (
          budget.categories.includes(t.category) &&
          t.type === 'expense' &&
          transactionDate >= periodStart &&
          transactionDate <= periodEnd
        );
      });

      const spent = periodTransactions.reduce((sum, t) => sum + t.amount, 0);
      const remaining = Math.max(0, budget.amount - spent);
      const percentageUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const isOverBudget = spent > budget.amount;

      // Calculate time-based projections
      const periodStart = new Date(currentPeriod.start_date);
      const now = new Date();
      const periodEnd = currentPeriod.end_date ? new Date(currentPeriod.end_date) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const daysElapsed = Math.max(1, Math.floor((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));
      const totalDays = Math.floor((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, totalDays - daysElapsed);

      const dailyAverage = spent / daysElapsed;
      const projectedSpending = dailyAverage * totalDays;

      // Determine status
      let status: 'on-track' | 'warning' | 'critical' | 'over-budget' = 'on-track';

      if (isOverBudget) {
        status = 'over-budget';
      } else if (projectedSpending > budget.amount * 1.1) {
        status = 'critical';
      } else if (projectedSpending > budget.amount) {
        status = 'warning';
      }

      return {
        budget,
        currentPeriod,
        spent,
        remaining,
        percentageUsed,
        dailyAverage,
        projectedSpending,
        status,
        isOverBudget,
        daysRemaining,
        daysElapsed,
        totalDays,
      };
    },
    enabled: !!budgetId,
    staleTime: 30 * 1000, // 30 seconds for budget performance
  });
};

/**
 * Transaction trends and patterns analysis
 */
export const useTransactionTrends = (userId?: string, days: number = 30) => {
  return useQuery({
    queryKey: [...queryKeys.transactions(), 'trends', userId || 'all', days],
    queryFn: async () => {
      const transactions = userId
        ? await transactionService.getByUserId(userId)
        : await transactionService.getAll();

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const recentTransactions = transactions.filter(t => new Date(t.date) >= cutoffDate);

      // Daily spending pattern
      const dailySpending = recentTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          const dateKey = new Date(t.date).toISOString().split('T')[0];
          acc[dateKey] = (acc[dateKey] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);

      // Category trends
      const categoryTrends = recentTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => {
          if (!acc[t.category]) {
            acc[t.category] = [];
          }
          acc[t.category].push({
            date: new Date(t.date),
            amount: t.amount,
          });
          return acc;
        }, {} as Record<string, Array<{ date: Date; amount: number }>>);

      // Calculate averages and trends
      const totalSpent = Object.values(dailySpending).reduce((sum, amount) => sum + amount, 0);
      const averageDailySpending = totalSpent / days;

      // Simple trend calculation (last 7 days vs previous 7 days)
      const recent7Days = Object.entries(dailySpending)
        .slice(-7)
        .reduce((sum, [, amount]) => sum + amount, 0);

      const previous7Days = Object.entries(dailySpending)
        .slice(-14, -7)
        .reduce((sum, [, amount]) => sum + amount, 0);

      const trendPercentage = previous7Days > 0
        ? ((recent7Days - previous7Days) / previous7Days) * 100
        : 0;

      return {
        dailySpending,
        categoryTrends,
        totalSpent,
        averageDailySpending,
        trendPercentage,
        isIncreasing: trendPercentage > 5,
        isDecreasing: trendPercentage < -5,
        transactionCount: recentTransactions.length,
        timeframe: { days, cutoffDate },
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Optimistic transaction creation with rollback
 */
export const useOptimisticTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: transactionService.create,

    // Optimistic update
    onMutate: async (newTransaction) => {
      // Cancel any outgoing re-fetches
      await queryClient.cancelQueries({ queryKey: queryKeys.transactions() });

      // Snapshot the previous value
      const previousTransactions = queryClient.getQueryData(queryKeys.transactions());

      // Optimistically update to the new value
      const optimisticTransaction = {
        ...newTransaction,
        id: `temp_${Date.now()}`,
        created_at: new Date(),
        updated_at: new Date(),
      };

      queryClient.setQueryData(queryKeys.transactions(), (old: Transaction[] = []) => [
        optimisticTransaction,
        ...old,
      ]);

      // Update account balance optimistically
      if (newTransaction.account_id) {
        queryClient.setQueryData(
          queryKeys.accountBalance(newTransaction.account_id),
          (oldBalance: number = 0) => {
            return newTransaction.type === 'income'
              ? oldBalance + newTransaction.amount
              : oldBalance - newTransaction.amount;
          }
        );
      }

      return { previousTransactions, optimisticTransaction };
    },

    // On error, rollback
    onError: (_, newTransaction, context) => {
      if (context?.previousTransactions) {
        queryClient.setQueryData(queryKeys.transactions(), context.previousTransactions);
      }

      // Revert account balance
      if (newTransaction.account_id && context?.optimisticTransaction) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.accountBalance(newTransaction.account_id)
        });
      }
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.financial() });
    },
  });
};

/**
 * Bulk transaction operations with progress tracking
 */
export const useBulkTransactionOperations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (operations: BulkOperation[]) => {
      const results = [];

      for (const operation of operations) {
        switch (operation.type) {
          case 'create':
            results.push(await transactionService.create(operation.data));
            break;
          case 'update':
            if (operation.id) {
              results.push(await transactionService.update(operation.id, operation.data));
            }
            break;
          case 'delete':
            if (operation.id) {
              await transactionService.delete(operation.id);
              results.push({ id: operation.id, deleted: true });
            }
            break;
        }
      }

      return results;
    },

    onSuccess: () => {
      // Invalidate all transaction-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets() });
      queryClient.invalidateQueries({ queryKey: queryKeys.financial() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
    },
  });
};
