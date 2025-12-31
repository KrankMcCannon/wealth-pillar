import { useState, useEffect, useMemo } from 'react';
import type { User, Budget, Transaction, BudgetPeriod } from '@/lib/types';
import type { UserBudgetSummary } from '@/lib/services';
import { BudgetService } from '@/lib/services';
import { isMember as checkIsMember } from '@/lib/utils/permissions';

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
  /** Optional budget periods map (if not provided, will fetch from DB) */
  budgetPeriods?: Map<string, BudgetPeriod | null>;
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
 * Centralizes the budget calculation logic used across dashboard and budgets pages.
 * Eliminates duplication by wrapping BudgetService.buildBudgetsByUser with async handling.
 *
 * **Permission Logic:**
 * - Members see only their own budget summary
 * - Admins see filtered summary based on selectedUserId (or all if undefined)
 *
 * **Features:**
 * - Automatic memoization for performance
 * - Handles permission-based filtering
 * - Reuses existing BudgetService methods (DRY principle)
 * - Async handling for budget period data
 *
 * @example Basic usage (dashboard)
 * ```tsx
 * const { budgetsByUser, isLoading } = useBudgetsByUser({
 *   groupUsers,
 *   budgets,
 *   transactions,
 *   currentUser,
 *   selectedUserId,
 *   budgetPeriods,
 * });
 * ```
 *
 * @example Single user summary (budgets page)
 * ```tsx
 * const { budgetsByUser } = useBudgetsByUser({
 *   groupUsers: [selectedBudgetUser],
 *   budgets,
 *   transactions,
 *   currentUser,
 *   selectedUserId: selectedBudgetUser.id,
 *   budgetPeriods,
 * });
 * const userSummary = budgetsByUser[selectedBudgetUser.id];
 * ```
 */
export function useBudgetsByUser({
  groupUsers,
  budgets,
  transactions,
  currentUser,
  selectedUserId,
  budgetPeriods,
}: UseBudgetsByUserOptions): UseBudgetsByUserReturn {
  const [budgetsByUser, setBudgetsByUser] = useState<Record<string, UserBudgetSummary>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Determine which users to calculate budgets for based on permissions (synchronous)
  const usersToInclude = useMemo(() => {
    if (!currentUser) return [];

    if (checkIsMember(currentUser)) {
      // Members see only their own budgets
      return [currentUser];
    } else {
      // Admin logic
      if (selectedUserId && selectedUserId !== 'all') {
        // Filter to specific user
        const selectedUser = groupUsers.find(u => u.id === selectedUserId);
        return selectedUser ? [selectedUser] : [];
      } else {
        // Show all group users
        return groupUsers;
      }
    }
  }, [currentUser, groupUsers, selectedUserId]);

  // Calculate budget summaries asynchronously
  useEffect(() => {
    let isMounted = true;

    async function calculateSummaries() {
      if (usersToInclude.length === 0) {
        setBudgetsByUser({});
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const result = await BudgetService.buildBudgetsByUser(
          usersToInclude,
          budgets,
          transactions,
          budgetPeriods
        );

        if (isMounted) {
          setBudgetsByUser(result);
        }
      } catch (error) {
        console.error('[useBudgetsByUser] Error calculating summaries:', error);
        if (isMounted) {
          setBudgetsByUser({});
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    calculateSummaries();

    return () => {
      isMounted = false;
    };
  }, [usersToInclude, budgets, transactions, budgetPeriods]);

  const userIds = useMemo(() => Object.keys(budgetsByUser), [budgetsByUser]);

  return { budgetsByUser, userIds, isLoading };
}
