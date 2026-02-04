import { Account, User } from '@/lib/types';
import { FinanceLogicService } from '@/server/services/finance-logic.service';

/**
 * Calculates which accounts should be displayed on the dashboard based on user permissions and selection.
 */
// Helper for member view logic
function getMemberAccounts(accounts: Account[], currentUser: User): Account[] {
  const userFilteredAccounts = accounts.filter((acc) => acc.user_ids.includes(currentUser.id));

  if (userFilteredAccounts.length === 1) {
    return userFilteredAccounts;
  }

  if (userFilteredAccounts.length > 1 && currentUser.default_account_id) {
    const defaultAccount = accounts.find((a) => a.id === currentUser.default_account_id);
    return defaultAccount ? [defaultAccount] : userFilteredAccounts;
  }

  return userFilteredAccounts;
}

// Helper for manager view logic
function getManagerAccounts(
  accounts: Account[],
  groupUsers: User[],
  selectedUserId: string | undefined
): Account[] {
  // Single account case
  if (accounts.length === 1) {
    return accounts;
  }

  // Multiple accounts case
  if (selectedUserId) {
    const user = groupUsers.find((u) => u.id === selectedUserId);
    if (user?.default_account_id) {
      const defaultAccount = accounts.find((a) => a.id === user.default_account_id);
      return defaultAccount ? [defaultAccount] : [];
    }
    // Fallback if no default account found for selected user?
    // The original logic returned [] if defaultAccount was missing, preserving that behavior.
    return [];
  }

  // No specific user selected, use default logic
  return FinanceLogicService.getDefaultAccounts(accounts, groupUsers);
}

export function calculateDisplayedAccounts(
  accounts: Account[],
  groupUsers: User[],
  accountBalances: Record<string, number>,
  currentUser: User,
  selectedUserId: string | undefined,
  isMember: boolean
): Account[] {
  let accountsToDisplay: Account[] = [];

  if (isMember) {
    accountsToDisplay = getMemberAccounts(accounts, currentUser);
  } else {
    accountsToDisplay = getManagerAccounts(accounts, groupUsers, selectedUserId);
  }

  return accountsToDisplay.sort((a, b) => {
    const balanceA = accountBalances[a.id] || 0;
    const balanceB = accountBalances[b.id] || 0;
    return balanceB - balanceA;
  });
}
