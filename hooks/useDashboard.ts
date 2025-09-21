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
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

/**
 * Enhanced dashboard data type with computed values
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
    const parseDate = (d: string | Date | undefined | null): Date | null => {
      if (!d) return null;
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? null : dt;
    };
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

    // Calculate account balances (shared accounts include all related transactions)
    const accountBalances: Record<string, number> = {};
    filteredData.accounts.forEach(account => {
      const accountTransactions = allTransactions.filter(
        t => t.account_id === account.id || t.to_account_id === account.id
      );

      const balance = accountTransactions.reduce((sum, t) => {
        // If this transaction explicitly moves between accounts, treat via to_account_id/account_id, regardless of type
        if (t.to_account_id) {
          if (t.account_id === account.id) return sum - t.amount; // outflow
          if (t.to_account_id === account.id) return sum + t.amount; // inflow
          return sum;
        }
        // Otherwise fallback to income/expense semantics
        if (t.type === 'income') return sum + t.amount;
        if (t.type === 'expense') return sum - t.amount;
        return sum;
      }, 0);

      accountBalances[account.id] = balance;
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

    // Dev-only diagnostics: account balance breakdown
    if (process.env.NODE_ENV === 'development') {
      try {
        const accountDiagnostics = filteredData.accounts.map((account) => {
          const rel = allTransactions.filter(
            t => t.account_id === account.id || t.to_account_id === account.id
          );
          const income = rel.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
          const expense = rel.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          const transferOut = rel.filter(t => t.type === 'transfer' && t.account_id === account.id).reduce((s, t) => s + t.amount, 0);
          const transferIn = rel.filter(t => t.type === 'transfer' && t.to_account_id === account.id).reduce((s, t) => s + t.amount, 0);
          const balanceCalc = income - expense - transferOut + transferIn;
          return {
            account: account.name,
            income,
            expense: -expense,
            transfer_out: -transferOut,
            transfer_in: transferIn,
            balance_calc: balanceCalc,
            balance_shown: accountBalances[account.id] || 0,
            tx_count: rel.length,
          };
        });
        // Collapse group to avoid noise unless needed
        // eslint-disable-next-line no-console
        console.groupCollapsed('[DEV] Account balance diagnostics');
        // eslint-disable-next-line no-console
        console.table(accountDiagnostics);
        // eslint-disable-next-line no-console
        console.groupEnd();
      } catch (_) {
        // ignore diagnostics errors
      }
    }

    // Calculate budget data with spending analysis
    const budgetData = filteredData.budgets.map(budget => {
      // Find active budget period
      const activePeriod = filteredData.budgetPeriods.find(
        period => period.budget_id === budget.id && period.is_active
      );

      // Calculate spending for budget categories
      // Always scope transactions to the budget owner to avoid cross-user mixing
      const budgetTransactions = allTransactions.filter(
        transaction =>
          transaction.user_id === budget.user_id &&
          budget.categories.includes(transaction.category) &&
          transaction.type === 'expense'
      );

      // If we have an active period, filter by period dates
      const relevantTransactions = activePeriod
        ? budgetTransactions.filter(transaction => {
            const transactionDate = parseDate(transaction.date);
            const periodStart = parseDate(activePeriod.start_date);
            const periodEnd = activePeriod.end_date ? parseDate(activePeriod.end_date) : new Date();
            if (!transactionDate || !periodStart || !periodEnd) return false;
            return transactionDate >= periodStart && transactionDate <= (periodEnd as Date);
          })
        : budgetTransactions;

      const spent = relevantTransactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      );

      const remaining = Math.max(0, budget.amount - spent);
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      const result = {
        id: budget.id,
        description: budget.description,
        amount: budget.amount,
        spent,
        remaining,
        percentage: Math.min(100, percentage),
        categories: budget.categories,
      } as const;

      // Dev-only diagnostics: budget breakdown
      if (process.env.NODE_ENV === 'development') {
        try {
          const periodLabel = activePeriod
            ? `${new Date(activePeriod.start_date as any).toISOString().slice(0,10)} → ${(activePeriod.end_date ? new Date(activePeriod.end_date as any) : new Date()).toISOString().slice(0,10)}`
            : 'no-active-period';
          const diag = {
            budget: budget.description,
            owner: budget.user_id,
            period: periodLabel,
            tx_count: relevantTransactions.length,
            spent,
            planned: budget.amount,
            percentage: Math.round(Math.min(100, percentage)),
          };
          // eslint-disable-next-line no-console
          console.groupCollapsed('[DEV] Budget diagnostics');
          // eslint-disable-next-line no-console
          console.table([diag]);
          // eslint-disable-next-line no-console
          console.groupEnd();
        } catch (_) {
          // ignore diagnostics errors
        }
      }

      return result;
    });

    // Create budget periods map for quick lookup
    const budgetPeriodsMap: Record<string, BudgetPeriod> = {};
    filteredData.budgetPeriods.forEach(period => {
      if (period.is_active) {
        budgetPeriodsMap[period.budget_id] = period;
      }
    });

    // Get upcoming/recurring transactions
    const upcomingTransactions = filteredData.transactions.filter(
      transaction =>
        transaction.type === 'recurrent' ||
        (transaction.frequency && transaction.frequency !== 'once')
    );

    return {
      users,
      currentUser,
      accounts: filteredData.accounts,
      budgets: filteredData.budgets,
      upcomingTransactions,
      accountBalances,
      totalBalance,
      budgetData,
      budgetPeriodsMap,
      accountNames,
    };
  }, [
    usersQuery.data,
    accountsQuery.data,
    transactionsQuery.data,
    budgetsQuery.data,
    selectedGroupFilter,
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
