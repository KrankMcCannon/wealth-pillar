import { useMemo } from 'react';
import type { User, Account } from '@/lib/types';
import { isMember as checkIsMember } from '@/lib/utils';

/**
 * Options for useFilteredAccounts hook
 */
interface UseFilteredAccountsOptions {
  /** Array of accounts to filter */
  accounts: Account[];
  /** Current logged-in user */
  currentUser: User | null;
  /** Selected user ID for admin filtering (undefined = show all for admins) */
  selectedUserId?: string;
  /** Optional additional filter function for domain-specific filtering */
  additionalFilter?: (account: Account) => boolean;
}

/**
 * Return type for useFilteredAccounts hook
 */
interface UseFilteredAccountsReturn {
  /** Filtered accounts based on permissions and optional additional filter */
  filteredAccounts: Account[];
  /** Active user ID being displayed ('all' for admins viewing all data) */
  activeUserId: string;
}

/**
 * Custom hook for filtering accounts based on user permissions
 *
 * Specialized version of useFilteredData for Account entities.
 * Accounts use `user_ids` array instead of single `user_id` string.
 *
 * **Permission Logic:**
 * - Members see only accounts where their ID is in the `user_ids` array
 * - Admins can filter by specific user or see all accounts
 *
 * **Features:**
 * - Handles `user_ids` array filtering (unlike regular useFilteredData)
 * - Automatic memoization for performance
 * - Optional additional filtering via callback
 * - Reuses existing permission utilities
 *
 * @example Basic usage
 * ```tsx
 * const { filteredAccounts } = useFilteredAccounts({
 *   accounts,
 *   currentUser,
 *   selectedUserId,
 * });
 * ```
 *
 * @example With additional filter
 * ```tsx
 * const { filteredAccounts } = useFilteredAccounts({
 *   accounts,
 *   currentUser,
 *   selectedUserId,
 *   additionalFilter: (account) => account.is_active,
 * });
 * ```
 */
export function useFilteredAccounts({
  accounts,
  currentUser,
  selectedUserId,
  additionalFilter,
}: UseFilteredAccountsOptions): UseFilteredAccountsReturn {
  const { filteredAccounts, activeUserId } = useMemo(() => {
    if (!currentUser) {
      return {
        filteredAccounts: [],
        activeUserId: 'all' as const,
      };
    }

    // Step 1: Apply permission-based filtering for accounts
    let permissionFiltered: Account[];

    if (checkIsMember(currentUser)) {
      // Members see only accounts where they are listed in user_ids
      permissionFiltered = accounts.filter((account) =>
        account.user_ids.includes(currentUser.id)
      );
    } else if (selectedUserId && selectedUserId !== 'all') {
      // Admin logic - Filter to accounts that include the selected user
      permissionFiltered = accounts.filter((account) =>
        account.user_ids.includes(selectedUserId)
      );
    } else {
      // Admin logic - Show all accounts
      permissionFiltered = accounts;
    }

    // Step 2: Apply optional additional filter
    const finalFiltered = additionalFilter
      ? permissionFiltered.filter(additionalFilter)
      : permissionFiltered;

    // Step 3: Calculate active user ID
    const activeUserId = selectedUserId && selectedUserId !== 'all'
      ? selectedUserId
      : 'all';

    return {
      filteredAccounts: finalFiltered,
      activeUserId,
    };
  }, [accounts, currentUser, selectedUserId, additionalFilter]);

  return { filteredAccounts, activeUserId };
}
