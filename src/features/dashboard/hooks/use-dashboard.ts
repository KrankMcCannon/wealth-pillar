'use client';

import { useUpcomingRecurringSeries } from '@/features/recurring';
import { Account, Budget, BudgetPeriod, calculateAccountBalance, calculateBudgetSpent, filterDataByUserRole, getActivePeriodDates, getBudgetTransactions, Transaction, useAccounts, useAccountsByUser, useBudgets, useBudgetsByUser, useCategories, User, useTransactions, useUsers } from '@/lib';
import { useMemo } from 'react';

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
export const useDashboardData = (selectedViewUserId: string = 'all', currentUser: User | null = null): DashboardData => {
  // Get upcoming recurring series using the new architecture
  const { data: upcomingSeries = [] } = useUpcomingRecurringSeries(7, selectedViewUserId !== 'all' ? selectedViewUserId : undefined);

  // Parallel queries for optimal performance
  // Determine query parameters based on user selection
  const isSpecificUserSelected = selectedViewUserId !== 'all' && selectedViewUserId !== currentUser?.id;

  // Use centralized hooks to apply consistent query logic
  const usersQuery = useUsers();
  const transactionsQuery = useTransactions();

  // Call hooks unconditionally and select results to respect rules-of-hooks
  const accountsAllQuery = useAccounts();
  const accountsByUserQuery = useAccountsByUser(isSpecificUserSelected ? selectedViewUserId : '');
  const accountsQuery = isSpecificUserSelected ? accountsByUserQuery : accountsAllQuery;

  const budgetsAllQuery = useBudgets();
  const budgetsByUserQuery = useBudgetsByUser(isSpecificUserSelected ? selectedViewUserId : '');
  const budgetsQuery = isSpecificUserSelected ? budgetsByUserQuery : budgetsAllQuery;

  // Categories are fetched for potential future use
  const categoriesQuery = useCategories();

  // Compute derived data with memoization for performance
  const computedData = useMemo(() => {
    // Extract data with fallbacks
    const users = usersQuery.data || [];
    const allAccounts = accountsQuery.data || [];
    const allTransactions = transactionsQuery.data || [];
    const allBudgets = budgetsQuery.data || [];
    const allBudgetPeriods = users.flatMap(u => (u as User).budget_periods || []);
    // Categories are fetched for potential future use but not currently utilized in dashboard calculations

    // Filter data using centralized role-based filtering
    if (!currentUser) {
      return {
        users,
        currentUser,
        accounts: [],
        budgets: [],
        upcomingTransactions: [],
        accountBalances: {},
        totalBalance: 0,
        budgetData: [],
        budgetsByUser: {},
        budgetPeriodsMap: {},
        accountNames: {},
      };
    }

    // Use centralized filtering for transactions, budgets, and budget periods
    const filteredTransactions = filterDataByUserRole(allTransactions, currentUser, selectedViewUserId);
    const filteredBudgets = filterDataByUserRole(allBudgets, currentUser, selectedViewUserId);
    const filteredBudgetPeriods = filterDataByUserRole(allBudgetPeriods, currentUser, selectedViewUserId);

    // Custom filtering for accounts (uses user_ids array instead of user_id)
    const getFilteredAccounts = (): Account[] => {
      const role = currentUser.role;

      if (role === 'member') {
        return allAccounts.filter(account =>
          account.user_ids.includes(currentUser.id)
        );
      }

      if (role === 'admin' || role === 'superadmin') {
        if (selectedViewUserId === 'all') {
          return allAccounts.filter(account =>
            account.group_id === currentUser.group_id
          );
        } else {
          const selectedUser = users.find(u => u.id === selectedViewUserId);
          if (!selectedUser || selectedUser.group_id !== currentUser.group_id) {
            return [];
          }
          return allAccounts.filter(account =>
            account.user_ids.includes(selectedViewUserId)
          );
        }
      }

      return [];
    };

    const filteredData = {
      accounts: getFilteredAccounts(),
      transactions: filteredTransactions,
      budgets: filteredBudgets,
      budgetPeriods: filteredBudgetPeriods,
    };

    // Calculate account balances using ALL transactions (not filtered)
    // Account balances must include all transactions that affect the account,
    // including transfers from other users in the group
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

      // Use centralized function to get relevant transactions (using filtered transactions)
      const relevantTransactions = getBudgetTransactions(
        filteredData.transactions,
        budget,
        currentPeriodStart || undefined,
        currentPeriodEnd || undefined
      );

      // Calculate spent using centralized function (using filtered transactions)
      const spent = calculateBudgetSpent(
        filteredData.transactions,
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
        // Get user's active period using centralized user data
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
    filteredBudgetPeriods.forEach(period => {
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
      date: series.due_date,
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
    upcomingSeries,
    currentUser,
    selectedViewUserId,
  ]);

  // Comprehensive loading and error state management
  const isLoading = (
    usersQuery.isLoading ||
    accountsQuery.isLoading ||
    transactionsQuery.isLoading ||
    budgetsQuery.isLoading ||
    categoriesQuery.isLoading
  );
  const isError = (
    usersQuery.isError ||
    accountsQuery.isError ||
    transactionsQuery.isError ||
    budgetsQuery.isError ||
    categoriesQuery.isError
  );

  // Collect errors from failed queries
  const errors = [
    usersQuery.isError ? { query: 'users', error: usersQuery.error } : null,
    accountsQuery.isError ? { query: 'accounts', error: accountsQuery.error } : null,
    transactionsQuery.isError ? { query: 'transactions', error: transactionsQuery.error } : null,
    budgetsQuery.isError ? { query: 'budgets', error: budgetsQuery.error } : null,
    categoriesQuery.isError ? { query: 'categories', error: categoriesQuery.error } : null,
  ].filter(Boolean) as Array<{ query: string; error: unknown }>;

  return {
    ...computedData,
    isLoading,
    isError,
    errors,
  };
};

export default useDashboardData;
