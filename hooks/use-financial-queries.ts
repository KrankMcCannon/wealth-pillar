'use client';

import {
  budgetPeriodService,
  budgetService,
  transactionService,
} from '@/lib/api-client';
import { QUERY_STALE_TIMES } from '@/lib/query-config';
import { queryKeys } from '@/lib/query-keys';
import { calculateAccountBalance } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

/**
 * Financial-specific query hooks for advanced use cases
 */

/**
 * Real-time balance tracking with optimistic updates
 * Uses window focus refetching instead of aggressive polling
 */
export const useAccountBalance = (accountId: string) => {
  return useQuery({
    queryKey: queryKeys.accountBalance(accountId),
    queryFn: async () => {
      const transactions = await transactionService.getAll();
      return calculateAccountBalance(accountId, transactions);
    },
    enabled: !!accountId,
    staleTime: QUERY_STALE_TIMES.accountBalances,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

/**
 * Budget performance tracking with enhanced period-aware alerts
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
          daysElapsed: 0,
          totalDays: 0,
          categorySpending: {},
        };
      }

      // Get transactions for the current period using centralized filtering
      const transactions = await transactionService.getAll();
      const periodStart = new Date(currentPeriod.start_date);
      const periodEnd = currentPeriod.end_date ? new Date(currentPeriod.end_date) : new Date();

      const periodTransactions = transactions.filter(t => {
        // Filter out corrupted transactions
        if (t.amount === null || t.account_id === "" || !t.category) return false;

        const transactionDate = new Date(t.date);

        // Ensure transaction belongs to budget user and matches categories
        return (
          t.user_id === budget.user_id &&
          budget.categories.includes(t.category) &&
          t.type === 'expense' &&
          transactionDate >= periodStart &&
          transactionDate <= periodEnd &&
          !isNaN(transactionDate.getTime()) // Valid date
        );
      });

      // Calculate category-wise spending breakdown
      const categorySpending: Record<string, number> = {};
      budget.categories.forEach(category => {
        const categoryTotal = periodTransactions
          .filter(t => t.category === category)
          .reduce((sum, t) => sum + t.amount, 0);
        if (categoryTotal > 0) {
          categorySpending[category] = Math.round(categoryTotal * 100) / 100;
        }
      });

      // Calculate totals with precision (allowing over-budget scenarios)
      const spent = Math.round(periodTransactions.reduce((sum, t) => sum + t.amount, 0) * 100) / 100;
      const remaining = Math.round((budget.amount - spent) * 100) / 100; // Can be negative when over budget
      const percentageUsed = budget.amount > 0 ? Math.round((spent / budget.amount) * 100 * 100) / 100 : 0; // Can exceed 100%
      const isOverBudget = spent > budget.amount;

      // Calculate enhanced time-based projections
      const now = new Date();
      const periodEndForCalc = currentPeriod.end_date ? new Date(currentPeriod.end_date) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const daysElapsed = Math.max(1, Math.floor((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));
      const totalDays = Math.max(1, Math.floor((periodEndForCalc.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));
      const daysRemaining = Math.max(0, totalDays - daysElapsed);

      const dailyAverage = Math.round((spent / daysElapsed) * 100) / 100;
      const projectedSpending = Math.round((dailyAverage * totalDays) * 100) / 100;

      // Enhanced status determination
      let status: 'on-track' | 'warning' | 'critical' | 'over-budget' = 'on-track';

      if (isOverBudget) {
        status = 'over-budget';
      } else if (projectedSpending > budget.amount * 1.15) {
        status = 'critical'; // Will exceed budget by 15%
      } else if (projectedSpending > budget.amount * 1.05) {
        status = 'warning'; // Will exceed budget by 5%
      } else if (percentageUsed > 90) {
        status = 'warning'; // Used 90% of budget
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
        categorySpending,
        transactionCount: periodTransactions.length,
        averageTransactionSize: periodTransactions.length > 0 ? Math.round((spent / periodTransactions.length) * 100) / 100 : 0,
      };
    },
    enabled: !!budgetId,
    staleTime: QUERY_STALE_TIMES.budgetAnalysis,
    refetchOnWindowFocus: true,
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
    staleTime: QUERY_STALE_TIMES.spendingTrends,
    refetchOnWindowFocus: true,
  });
};
