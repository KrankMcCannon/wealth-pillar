import { useMemo } from 'react';
import type { User } from '@/lib/types';
import { isMember as checkIsMember } from '@/lib/utils';

/**
 * Options for useFilteredData hook
 */
interface UseFilteredDataOptions<T extends { user_id: string | null }> {
  /** Array of items to filter */
  data: T[];
  /** Current logged-in user */
  currentUser: User | null;
  /** Selected user ID for admin filtering (undefined = show all for admins) */
  selectedUserId?: string;
  /** Optional additional filter function for domain-specific filtering */
  additionalFilter?: (item: T) => boolean;
}

/**
 * Return type for useFilteredData hook
 */
interface UseFilteredDataReturn<T> {
  /** Filtered data based on permissions and optional additional filter */
  filteredData: T[];
  /** Active user ID being displayed ('all' for admins viewing all data) */
  activeUserId: string | 'all';
}

/**
 * Custom hook for filtering data based on user permissions
 *
 * Centralizes the permission-based filtering logic used across all *-content.tsx files.
 * Eliminates duplication by reusing existing `filterByUserPermissions` utility.
 *
 * **Permission Logic:**
 * - Members automatically see only their own data
 * - Admins see filtered data based on selectedUserId (or all if undefined)
 *
 * **Features:**
 * - Automatic memoization for performance
 * - Generic type support for any entity with `user_id`
 * - Optional additional filtering via callback
 * - Reuses existing permission utilities (DRY principle)
 *
 * @example Basic usage
 * ```tsx
  * const { filteredData: filteredTransactions } = useFilteredData({
    *   data: transactions,
    *   currentUser,
    *   selectedUserId,
    * });
 * ```
 *
 * @example With additional domain filter
 * ```tsx
  * const { filteredData: activeBudgets } = useFilteredData({
    *   data: budgets,
    *   currentUser,
    *   selectedUserId,
    *   additionalFilter: (budget) => budget.amount > 0,
 * });
 * ```
 *
 * @example Getting active user ID for forms
 * ```tsx
  * const { filteredData, activeUserId } = useFilteredData({
    *   data: transactions,
    *   currentUser,
    *   selectedUserId,
    * });
 * // Use activeUserId in forms or display logic
 * ```
 */
export function useFilteredData<T extends { user_id: string | null }>({
  data,
  currentUser,
  selectedUserId,
  additionalFilter,
}: UseFilteredDataOptions<T>): UseFilteredDataReturn<T> {
  const { filteredData, activeUserId } = useMemo(() => {
    if (!currentUser) {
      return {
        filteredData: [],
        activeUserId: 'all' as const,
      };
    }

    // Step 1: Apply permission-based filtering
    // This handles both member (own data only) and admin (filtered/all) logic
    let permissionFiltered: T[];

    if (checkIsMember(currentUser)) {
      // Members see only their own items
      permissionFiltered = data.filter(item => item.user_id === currentUser.id);
    } else {
      // Admin logic
      if (selectedUserId && selectedUserId !== 'all') {
        // Filter to specific user
        permissionFiltered = data.filter(item => item.user_id === selectedUserId);
      } else {
        // Show all items
        permissionFiltered = data;
      }
    }

    // Step 2: Apply optional additional filter for domain-specific logic
    const finalFiltered = additionalFilter
      ? permissionFiltered.filter(additionalFilter)
      : permissionFiltered;

    // Step 3: Calculate active user ID for display/forms
    // 'all' indicates admin viewing all users' data
    const activeUserId = selectedUserId && selectedUserId !== 'all'
      ? selectedUserId
      : 'all';

    return {
      filteredData: finalFiltered,
      activeUserId,
    };
  }, [data, currentUser, selectedUserId, additionalFilter]);

  return { filteredData, activeUserId };
}
