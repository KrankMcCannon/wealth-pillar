'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from '@/lib/query-keys';
import { budgetService, categoryService } from '@/lib/api-client';
import type { User, Budget, Transaction, BudgetPeriod } from '@/lib/types';
import {
  calculateBudgetSpent,
  getBudgetTransactions,
  getActivePeriodDates
} from '@/lib/utils';

/**
 * Budget-specific dashboard hook - handles budget calculations separately
 * Follows Single Responsibility Principle - only handles budget logic
 */
export const useDashboardBudgets = (
  selectedUserId: string = 'all',
  currentUser: User | null,
  users: User[] = [],
  transactions: Transaction[] = [],
  enabled: boolean = true
) => {
  // Budget query with intelligent caching
  const budgetsQuery = useQuery({
    queryKey: selectedUserId !== 'all' && selectedUserId !== currentUser?.id
      ? queryKeys.budgetsByUser(selectedUserId)
      : queryKeys.budgets(),
    queryFn: selectedUserId !== 'all' && selectedUserId !== currentUser?.id
      ? () => budgetService.getByUserId(selectedUserId)
      : budgetService.getAll,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: enabled && !!currentUser,
  });

  // Categories for budget categorization
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories(),
    queryFn: categoryService.getAll,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: enabled && !!currentUser,
  });

  // Optimized budget calculations with role-based filtering
  const budgetData = useMemo(() => {
    if (!budgetsQuery.data || !users.length) {
      return {
        budgets: [],
        budgetsByUser: {},
        budgetData: [],
        hasData: false,
      };
    }

    const allBudgets = budgetsQuery.data;
    const allBudgetPeriods = users.flatMap(u => u.budget_periods || []);

    // Filter budgets based on user role and selection
    const getFilteredBudgets = (): Budget[] => {
      if (!currentUser) return [];

      const isMember = currentUser.role === 'member';
      const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';

      if (isMember) {
        return allBudgets.filter(budget => budget.user_id === currentUser.id);
      }

      if (isAdmin) {
        if (selectedUserId === 'all') {
          return allBudgets.filter(budget => {
            const budgetUser = users.find(u => u.id === budget.user_id);
            return budgetUser?.group_id === currentUser.group_id;
          });
        } else {
          const selectedUser = users.find(u => u.id === selectedUserId);
          if (!selectedUser || selectedUser.group_id !== currentUser.group_id) {
            return [];
          }
          return allBudgets.filter(budget => budget.user_id === selectedUserId);
        }
      }

      return [];
    };

    const filteredBudgets = getFilteredBudgets();

    // Calculate budget data efficiently
    const budgetDataArray = filteredBudgets.map(budget => {
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
        periodStart: periodStart?.toISOString() || null,
        periodEnd: periodEnd?.toISOString() || null,
        transactionCount: relevantTransactions.length,
      };
    }).filter(Boolean);

    // Group budgets by user for UI organization
    const budgetsByUser = users.reduce((acc, user) => {
      const userBudgets = budgetDataArray.filter(b => b?.userId === user.id);

      if (userBudgets.length > 0) {
        const userActivePeriod = user.budget_periods?.find(p => p.is_active);
        const totalBudget = userBudgets.reduce((sum, b) => sum + (b?.amount || 0), 0);
        const totalSpent = userBudgets.reduce((sum, b) => sum + (b?.spent || 0), 0);
        const totalRemaining = totalBudget - totalSpent;
        const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100 * 100) / 100 : 0;

        acc[user.id] = {
          user,
          budgets: userBudgets.map(b => ({
            id: b!.id,
            description: b!.description,
            amount: b!.amount,
            spent: b!.spent,
            remaining: b!.remaining,
            percentage: b!.percentage,
            categories: b!.categories,
            transactionCount: b!.transactionCount,
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

      return acc;
    }, {} as Record<string, any>);

    return {
      budgets: filteredBudgets,
      budgetsByUser,
      budgetData: budgetDataArray,
      hasData: filteredBudgets.length > 0,
    };
  }, [budgetsQuery.data, users, transactions, currentUser, selectedUserId]);

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