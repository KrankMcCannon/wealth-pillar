/**
 * Accounts View Model
 * Business logic for the accounts page
 * Handles calculations, filtering, and sorting
 */

import { Account } from '@/lib';

export interface AccountsViewModel {
  totalAccounts: number;
  positiveAccounts: number;
  negativeAccounts: number;
  sortedAccounts: Account[];
}

/**
 * Create accounts view model from raw data
 * Applies sorting and calculations
 */
export function createAccountsViewModel(
  accounts: Account[],
  accountBalances: Record<string, number>
): AccountsViewModel {
  const totalAccounts = accounts?.length || 0;

  // Count positive and negative accounts
  const positiveAccounts = accounts?.filter(
    (acc: Account) => (accountBalances[acc.id] || 0) > 0
  ).length || 0;

  const negativeAccounts = accounts?.filter(
    (acc: Account) => (accountBalances[acc.id] || 0) < 0
  ).length || 0;

  // Sort accounts by balance (highest first)
  const sortedAccounts = [...(accounts || [])].sort((a: Account, b: Account) => {
    const balanceA = accountBalances[a.id] || 0;
    const balanceB = accountBalances[b.id] || 0;
    return balanceB - balanceA;
  });

  return {
    totalAccounts,
    positiveAccounts,
    negativeAccounts,
    sortedAccounts,
  };
}
