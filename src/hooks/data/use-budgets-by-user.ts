import { useMemo } from 'react';
import type { User, Budget, Transaction } from '@/lib/types';
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
}

/**
 * Return type for useBudgetsByUser hook
 */
interface UseBudgetsByUserReturn {
  /** Budget summaries by user ID */
  budgetsByUser: Record<string, UserBudgetSummary>;
  /** Array of user IDs that have budgets */
  userIds: string[];
}

/**
 * Custom hook for calculating budget summaries by user
 *
 * Centralizes the budget calculation logic used across dashboard and budgets pages.
 * Eliminates duplication by wrapping BudgetService.buildBudgetsByUser with memoization.
 *
 * **Permission Logic:**
 * - Members see only their own budget summary
 * - Admins see filtered summary based on selectedUserId (or all if undefined)
 *
 * **Features:**
 * - Automatic memoization for performance
 * - Handles permission-based filtering
 * - Reuses existing BudgetService methods (DRY principle)
 *
 * @example Basic usage (dashboard)
 * ```tsx
 * const { budgetsByUser } = useBudgetsByUser({
 *   groupUsers,
 *   budgets,
 *   transactions,
 *   currentUser,
 *   selectedUserId,
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
}: UseBudgetsByUserOptions): UseBudgetsByUserReturn {
  const { budgetsByUser, userIds } = useMemo(() => {
    if (!currentUser) {
      return {
        budgetsByUser: {},
        userIds: [],
      };
    }

    // Determine which users to calculate budgets for based on permissions
    let usersToInclude: User[];

    if (checkIsMember(currentUser)) {
      // Members see only their own budgets
      usersToInclude = [currentUser];
    } else {
      // Admin logic
      if (selectedUserId && selectedUserId !== 'all') {
        // Filter to specific user
        const selectedUser = groupUsers.find(u => u.id === selectedUserId);
        usersToInclude = selectedUser ? [selectedUser] : [];
      } else {
        // Show all group users
        usersToInclude = groupUsers;
      }
    }

    // Calculate budget summaries for included users
    const budgetsByUser = BudgetService.buildBudgetsByUser(
      usersToInclude,
      budgets,
      transactions
    );

    const userIds = Object.keys(budgetsByUser);

    return {
      budgetsByUser,
      userIds,
    };
  }, [groupUsers, budgets, transactions, currentUser, selectedUserId]);

  return { budgetsByUser, userIds };
}
