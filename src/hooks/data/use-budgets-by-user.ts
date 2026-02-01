import { useMemo } from 'react';
import type { User, Budget, Transaction, BudgetPeriod, UserBudgetSummary } from '@/lib/types';
import { FinanceLogicService } from '@/server/services/finance-logic.service';
import { isMember as checkIsMember } from '@/lib/utils';

/**
 * Options for useBudgetsByUser hook
 */
interface UseBudgetsByUserOptions {
  /** All group users */
  groupUsers: User[];
  /** All budgets */
  budgets: Budget[];
  /** All transactions */
  transactions: Transaction[];
  /** Current logged-in user */
  currentUser: User | null;
  /** Selected user ID for filtering (undefined = all for admins) */
  selectedUserId?: string;
  /** Optional budget periods map */
  budgetPeriods?: Record<string, BudgetPeriod | null>;
  /** Optional pre-calculated budget summaries (server-side optimization) */
  precalculatedData?: Record<string, UserBudgetSummary>;
}

/**
 * Return type for useBudgetsByUser hook
 */
interface UseBudgetsByUserReturn {
  /** Budget summaries by user ID */
  budgetsByUser: Record<string, UserBudgetSummary>;
  /** Array of user IDs that have budgets */
  userIds: string[];
  /** Loading state */
  isLoading: boolean;
}

/**
 * Custom hook for calculating budget summaries by user
 *
 */
export function useBudgetsByUser({
  groupUsers,
  budgets,
  transactions,
  currentUser,
  selectedUserId,
  budgetPeriods = {},
  precalculatedData,
}: UseBudgetsByUserOptions): UseBudgetsByUserReturn {

  // Determine which users to calculate budgets for based on permissions
  const usersToInclude = useMemo(() => {
    if (!currentUser) return [];

    if (checkIsMember(currentUser)) {
      // Members see only their own budgets
      return [currentUser];
    } 
    
    // Admin logic
    if (selectedUserId && selectedUserId !== 'all') {
      // Filter to specific user
      const selectedUser = groupUsers.find(u => u.id === selectedUserId);
      return selectedUser ? [selectedUser] : [];
    }
    
    // Show all group users
    return groupUsers;
  }, [currentUser, groupUsers, selectedUserId]);

  // Calculate budget summaries synchronously
  const budgetsByUser = useMemo(() => {
    // Optimization: Use pre-calculated data if provided
    if (precalculatedData && Object.keys(precalculatedData).length > 0) {
      return precalculatedData;
    }

    if (usersToInclude.length === 0) {
      return {};
    }

    // Use pure logic service
    return FinanceLogicService.buildBudgetsByUserPure(
      usersToInclude,
      budgets,
      transactions,
      budgetPeriods
    );
  }, [usersToInclude, budgets, transactions, budgetPeriods, precalculatedData]);

  const userIds = useMemo(() => Object.keys(budgetsByUser), [budgetsByUser]);

  return { budgetsByUser, userIds, isLoading: false };
}
