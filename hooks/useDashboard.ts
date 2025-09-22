'use client';

import {
  accountService,
  budgetPeriodService,
  budgetService,
  categoryService,
  transactionService,
  userService,
} from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import type {
  Account,
  Budget,
  BudgetPeriod,
  Transaction,
  User,
} from '@/lib/types';
import {
  calculateAccountBalance,
  calculateBudgetSpent,
  getActivePeriodDates,
  getBudgetTransactions
} from '@/lib/utils';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useUpcomingRecurringSeries } from '@/hooks';

/**
 * Enhanced dashboard data type with user-grouped budget data
 */
interface DashboardData {
  users: User[];
  currentUser: User | null;
  accounts: Account[];
  budgets: Budget[];
  upcomingTransactions: Transaction[];
  accountBalances: Record<string, number>;
  totalBalance: number;
  budgetData: Array<{
    id: string;
    description: string;
    amount: number;
    spent: number;
    remaining: number;
    percentage: number;
    categories: string[];
    userId: string;
    userName: string;
    activePeriod: BudgetPeriod | undefined;
    periodStart: string | null;
    periodEnd: string | null;
    transactionCount: number;
  }>;
  budgetsByUser: Record<string, {
    user: User;
    budgets: Array<{
      id: string;
      description: string;
      amount: number;
      spent: number;
      remaining: number;
      percentage: number;
      categories: string[];
      transactionCount: number;
    }>;
    activePeriod: BudgetPeriod | undefined;
    periodStart: string | null;
    periodEnd: string | null;
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
    overallPercentage: number;
  }>;
  budgetPeriodsMap: Record<string, BudgetPeriod>;
  accountNames: Record<string, string>;
  isLoading: boolean;
  isError: boolean;
  errors: Array<{ query: string; error: unknown }>;
}

/**
 * Comprehensive dashboard hook with parallel queries and optimized data fetching
 *
 * Features:
 * - Parallel data fetching for optimal performance
 * - Intelligent error handling with granular error reporting
 * - Computed financial metrics and balances
 * - User filtering support for family group management
 * - Optimistic loading states
 * - Real-time budget calculations
 */
export const useDashboardData = (selectedGroupFilter: string = 'all'): DashboardData => {
  // Get upcoming recurring series using the new architecture
  const { data: upcomingSeries = [] } = useUpcomingRecurringSeries(7, selectedGroupFilter !== 'all' ? selectedGroupFilter : undefined);

  // Parallel queries for optimal performance
  const queries = useQueries({
    queries: [
      {
        queryKey: queryKeys.users(),
        queryFn: userService.getAll,
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
      {
        queryKey: queryKeys.accounts(),
        queryFn: accountService.getAll,
        staleTime: 2 * 60 * 1000, // 2 minutes
      },
      {
        queryKey: queryKeys.transactions(),
        queryFn: transactionService.getAll,
        staleTime: 30 * 1000, // 30 seconds
      },
      {
        queryKey: queryKeys.budgets(),
        queryFn: budgetService.getAll,
        staleTime: 2 * 60 * 1000,
      },
      {
        queryKey: queryKeys.categories(),
        queryFn: categoryService.getAll,
        staleTime: 10 * 60 * 1000, // 10 minutes
      },
    ],
  });

  const [
    usersQuery,
    accountsQuery,
    transactionsQuery,
    budgetsQuery,
  ] = queries;

  // Compute derived data with memoization for performance
  const computedData = useMemo(() => {
    // Extract data with fallbacks
    const users = usersQuery.data || [];
    const allAccounts = accountsQuery.data || [];
    const allTransactions = transactionsQuery.data || [];
    const allBudgets = budgetsQuery.data || [];
    const allBudgetPeriods = users.flatMap(u => (u as User).budget_periods || []);
    // Categories are fetched for potential future use but not currently utilized in dashboard calculations

    // Determine current user (first user for demo purposes)
    const currentUser = users[0] || null;

    // Filter data based on selected group filter
    const getFilteredData = () => {
      if (selectedGroupFilter === 'all') {
        return {
          accounts: allAccounts,
          transactions: allTransactions,
          budgets: allBudgets,
          budgetPeriods: allBudgetPeriods,
        };
      }

      // Filter by specific user
      const accounts = allAccounts.filter(account =>
        account.user_ids.includes(selectedGroupFilter)
      );

      const transactions = allTransactions.filter(transaction =>
        transaction.user_id === selectedGroupFilter
      );

      const budgets = allBudgets.filter(budget =>
        budget.user_id === selectedGroupFilter
      );

      const budgetPeriods = allBudgetPeriods.filter(period =>
        period.user_id === selectedGroupFilter
      );

      return { accounts, transactions, budgets, budgetPeriods };
    };

    const filteredData = getFilteredData();

    // Calculate account balances using centralized function
    const accountBalances: Record<string, number> = {};
    filteredData.accounts.forEach(account => {
      accountBalances[account.id] = calculateAccountBalance(account.id, allTransactions);
    });

    // Calculate total balance
    const totalBalance = Object.values(accountBalances).reduce(
      (sum, balance) => sum + balance,
      0
    );

    // Create account names map for quick lookup
    const accountNames: Record<string, string> = {};
    filteredData.accounts.forEach(account => {
      accountNames[account.id] = account.name;
    });

    // Calculate budget data with user-level period awareness using centralized functions
    const budgetData = filteredData.budgets.map(budget => {
      // Find the user for this budget
      const user = users.find(u => u.id === budget.user_id);
      if (!user) {
        return {
          id: budget.id,
          description: budget.description,
          amount: budget.amount,
          spent: 0,
          remaining: budget.amount,
          percentage: 0,
          categories: budget.categories,
          userId: budget.user_id,
          userName: 'Unknown User',
          activePeriod: undefined,
          periodStart: null,
          periodEnd: null,
          transactionCount: 0,
        };
      }

      // Get period dates using centralized function
      const { start: currentPeriodStart, end: currentPeriodEnd } = getActivePeriodDates(user);
      const activePeriod = user.budget_periods?.find(period => period.is_active);

      // Use centralized function to get relevant transactions
      const relevantTransactions = getBudgetTransactions(
        allTransactions,
        budget,
        currentPeriodStart || undefined,
        currentPeriodEnd || undefined
      );

      // Calculate spent using centralized function
      const spent = calculateBudgetSpent(
        allTransactions,
        budget,
        currentPeriodStart || undefined,
        currentPeriodEnd || undefined
      );

      // Calculate remaining and percentage (can exceed 100% when over budget)
      const remaining = Math.round((budget.amount - spent) * 100) / 100; // Can be negative when over budget
      const percentage = budget.amount > 0 ? Math.round((spent / budget.amount) * 100 * 100) / 100 : 0; // Can exceed 100%

      return {
        id: budget.id,
        description: budget.description,
        amount: budget.amount,
        spent,
        remaining,
        percentage,
        categories: budget.categories,
        userId: budget.user_id,
        userName: user.name || 'Unknown User',
        activePeriod,
        periodStart: currentPeriodStart?.toISOString() || null,
        periodEnd: currentPeriodEnd?.toISOString() || null,
        transactionCount: relevantTransactions.length,
      } as const;
    });

    // Create budgets grouped by user for better organization
    const budgetsByUser: Record<string, {
      user: User;
      budgets: Array<{
        id: string;
        description: string;
        amount: number;
        spent: number;
        remaining: number;
        percentage: number;
        categories: string[];
        transactionCount: number;
      }>;
      activePeriod: BudgetPeriod | undefined;
      periodStart: string | null;
      periodEnd: string | null;
      totalBudget: number;
      totalSpent: number;
      totalRemaining: number;
      overallPercentage: number;
    }> = {};

    users.forEach(user => {
      const userBudgets = budgetData.filter(b => b.userId === user.id);

      if (userBudgets.length > 0) {
        // Get user's active period using centralized function
        const userActivePeriod = user.budget_periods?.find(p => p.is_active);

        const totalBudget = userBudgets.reduce((sum, b) => sum + b.amount, 0);
        const totalSpent = userBudgets.reduce((sum, b) => sum + b.spent, 0);
        const totalRemaining = totalBudget - totalSpent;
        const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100 * 100) / 100 : 0;

        budgetsByUser[user.id] = {
          user,
          budgets: userBudgets.map(b => ({
            id: b.id,
            description: b.description,
            amount: b.amount,
            spent: b.spent,
            remaining: b.remaining,
            percentage: b.percentage,
            categories: b.categories,
            transactionCount: b.transactionCount,
          })),
          activePeriod: userActivePeriod,
          periodStart: userActivePeriod ? new Date(userActivePeriod.start_date).toISOString() : null,
          periodEnd: userActivePeriod?.end_date ? new Date(userActivePeriod.end_date).toISOString() : null,
          totalBudget,
          totalSpent,
          totalRemaining,
          overallPercentage,
        };
      }
    });

    // Create budget periods map for quick lookup (by user_id since periods are user-level)
    const budgetPeriodsMap: Record<string, BudgetPeriod> = {};
    filteredData.budgetPeriods.forEach(period => {
      if (period.is_active) {
        budgetPeriodsMap[period.user_id] = period;
      }
    });

    // Create upcoming transactions from recurring series data
    const upcomingTransactions: Transaction[] = upcomingSeries.map(series => ({
      id: `upcoming_${series.id}`,
      user_id: series.user_id,
      account_id: series.account_id,
      amount: series.amount,
      type: series.type,
      category: series.category,
      description: series.description,
      date: series.next_due_date,
      frequency: series.frequency,
      status: 'pending' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      recurring_series_id: series.id
    }));

    return {
      users,
      currentUser,
      accounts: filteredData.accounts,
      budgets: filteredData.budgets,
      upcomingTransactions,
      accountBalances,
      totalBalance,
      budgetData,
      budgetsByUser,
      budgetPeriodsMap,
      accountNames,
    };
  }, [
    usersQuery.data,
    accountsQuery.data,
    transactionsQuery.data,
    budgetsQuery.data,
    selectedGroupFilter,
    upcomingSeries,
  ]);

  // Comprehensive loading and error state management
  const isLoading = queries.some(query => query.isLoading);
  const isError = queries.some(query => query.isError);

  // Collect errors from failed queries
  const errors = queries
    .map((query, index) => {
      const queryNames = ['users', 'accounts', 'transactions', 'budgets', 'categories'];
      return query.isError ? { query: queryNames[index], error: query.error } : null;
    })
    .filter(Boolean) as Array<{ query: string; error: unknown }>;

  return {
    ...computedData,
    isLoading,
    isError,
    errors,
  };
};

/**
 * Hook for prefetching dashboard data
 * Useful for optimizing navigation and user experience
 */
export const usePrefetchDashboard = () => {
  // This hook can be used in layouts or navigation components
  // to prefetch dashboard data before the user navigates to it
  return useQuery({
    queryKey: queryKeys.dashboard(),
    queryFn: async () => {
      // Prefetch all dashboard dependencies
      await Promise.all([
        userService.getAll(),
        accountService.getAll(),
        transactionService.getAll(),
        budgetService.getAll(),
        budgetPeriodService.getAll(),
        categoryService.getAll(),
      ]);
      return true;
    },
    enabled: false, // Manual prefetching
    staleTime: Infinity, // Keep prefetched data fresh
  });
};

export default useDashboardData;
