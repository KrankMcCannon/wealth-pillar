/**
 * Balance Section View Model
 * Business logic for the balance section component (account slider + total balance)
 * Handles filtering default accounts and sorting by balance
 */

import { Account, User } from '@/lib';

export interface BalanceSectionViewModel {
  defaultAccounts: Account[];
  sortedAccounts: Account[];
  hasAccounts: boolean;
}

/**
 * Get default accounts view model
 * Filters accounts to show only those marked as default (payment methods)
 * Sorts by balance (highest first)
 */
export function getDefaultAccountsViewModel(
  accounts: Account[],
  users: User[],
  accountBalances: Record<string, number>
): BalanceSectionViewModel {
  // Get default account IDs from all users
  const defaultAccountIds = new Set(
    users
      .map(user => user.default_account_id)
      .filter((id): id is string => id !== undefined && id !== null)
  );

  // Filter to show only default accounts
  const defaultAccounts = accounts.filter(account =>
    defaultAccountIds.has(account.id)
  );

  // Sort by balance (highest first)
  const sortedAccounts = [...defaultAccounts].sort((a: Account, b: Account) => {
    const balanceA = accountBalances[a.id] || 0;
    const balanceB = accountBalances[b.id] || 0;
    return balanceB - balanceA;
  });

  return {
    defaultAccounts,
    sortedAccounts,
    hasAccounts: sortedAccounts.length > 0,
  };
}
