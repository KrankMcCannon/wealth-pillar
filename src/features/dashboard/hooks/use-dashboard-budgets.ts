'use client';

import { BudgetPeriod, calculateBudgetSpent, filterDataByUserRole, getActivePeriodDates, getBudgetTransactions, Transaction, useBudgets, useBudgetsByUser, useCategories, User } from '@/src/lib';
import { useMemo } from 'react';

/**
 * Budget-specific dashboard hook - handles budget calculations separately
 * Follows Single Responsibility Principle - only handles budget logic
 */
export const useDashboardBudgets = (
  selectedUserId: string = 'all',
  currentUser: User | null,
  users: User[] = [],
  transactions: Transaction[] = [],
  _enabled: boolean = true
) => {
  // Budget query with intelligent caching
  const isSpecificUserSelected = selectedUserId !== 'all' && selectedUserId !== currentUser?.id;
  const budgetsAllQuery = useBudgets();
  const budgetsByUserQuery = useBudgetsByUser(isSpecificUserSelected ? selectedUserId : '');
  const budgetsQuery = isSpecificUserSelected ? budgetsByUserQuery : budgetsAllQuery;

  // Categories for budget categorization
  const categoriesQuery = useCategories();

  // Optimized budget calculations with role-based filtering
  type BudgetItem = {
    id: string;
    description: string;
    amount: number;
    spent: number;
    remaining: number;
    percentage: number;
    categories: string[];
    userId: string;
    userName: string;
    activePeriod?: BudgetPeriod;
    periodStart: string | null;
    periodEnd: string | null;
    transactionCount: number;
  };

  const budgetData = useMemo(() => {
    if (!_enabled || !budgetsQuery.data || !users.length) {
      return {
        budgets: [],
        budgetsByUser: {},
        budgetData: [],
        hasData: false,
      };
    }

    const allBudgets = budgetsQuery.data;

    // Filter budgets using centralized role-based filtering
    const filteredBudgets = currentUser
      ? filterDataByUserRole(allBudgets, currentUser, selectedUserId)
      : [];

    // Calculate budget data efficiently
    const budgetDataArray = filteredBudgets.map<BudgetItem | null>(budget => {
      const user = users.find(u => u.id === budget.user_id);
      if (!user) return null;

      const { start: periodStart, end: periodEnd } = getActivePeriodDates(user);
      const activePeriod = user.budget_periods?.find(p => p.is_active);

      const relevantTransactions = getBudgetTransactions(
        transactions,
        budget,
        periodStart || undefined,
        periodEnd || undefined
      );

      const spent = calculateBudgetSpent(
        transactions,
        budget,
        periodStart || undefined,
        periodEnd || undefined
      );

      const remaining = Math.round((budget.amount - spent) * 100) / 100;
      const percentage = budget.amount > 0 ? Math.round((spent / budget.amount) * 100 * 100) / 100 : 0;

      const item: BudgetItem = {
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
        periodStart: periodStart?.toISOString() || null,
        periodEnd: periodEnd?.toISOString() || null,
        transactionCount: relevantTransactions.length,
      };
      return item;
    }).filter((b): b is BudgetItem => Boolean(b));

    // Get unique user IDs from filtered budgets only
    const filteredUserIds = new Set(budgetDataArray.map(b => b.userId));
    const filteredUsers = users.filter(u => filteredUserIds.has(u.id));

    // Group budgets by user for UI organization - only include users with budgets in filtered data
    const budgetsByUser = filteredUsers.reduce((acc, user) => {
      const userBudgets: BudgetItem[] = budgetDataArray.filter(b => b.userId === user.id);

      if (userBudgets.length > 0) {
        const userActivePeriod = user.budget_periods?.find(p => p.is_active);
        const totalBudget = userBudgets.reduce((sum, b) => sum + (b?.amount || 0), 0);
        const totalSpent = userBudgets.reduce((sum, b) => sum + (b?.spent || 0), 0);
        const totalRemaining = totalBudget - totalSpent;
        const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100 * 100) / 100 : 0;

        acc[user.id] = {
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
          activePeriod: userActivePeriod || undefined,
          periodStart: userActivePeriod ? new Date(userActivePeriod.start_date).toISOString() : null,
          periodEnd: userActivePeriod?.end_date ? new Date(userActivePeriod.end_date).toISOString() : null,
          totalBudget,
          totalSpent,
          totalRemaining,
          overallPercentage,
        };
      }

      return acc;
    }, {} as Record<string, {
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
    }>);

    return {
      budgets: filteredBudgets,
      budgetsByUser,
      budgetData: budgetDataArray,
      hasData: filteredBudgets.length > 0,
    };
  }, [budgetsQuery.data, users, transactions, currentUser, selectedUserId, _enabled]);

  return {
    ...budgetData,
    categories: categoriesQuery.data || [],
    isLoading: budgetsQuery.isLoading || categoriesQuery.isLoading,
    isError: budgetsQuery.isError || categoriesQuery.isError,
    errors: {
      budgets: budgetsQuery.error,
      categories: categoriesQuery.error,
    },
    refetch: {
      budgets: budgetsQuery.refetch,
      categories: categoriesQuery.refetch,
    },
  };
};

export default useDashboardBudgets;
