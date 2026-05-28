import type { Account } from '@/lib/types';
import { roundMoney } from '@/lib/utils/money';

/**
 * Get default accounts for users (Pure business logic)
 */
export function getDefaultAccounts(
  accounts: Account[],
  users: Array<{ id: string; default_account_id?: string | null }>
): Account[] {
  const defaultAccountIds = new Set(
    users
      .map((user) => user.default_account_id)
      .filter((id): id is string => id !== null && id !== undefined)
  );

  return accounts.filter((account) => defaultAccountIds.has(account.id));
}

export interface AccountStats {
  totalBalance: number;
  totalAccounts: number;
  positiveAccounts: number;
  negativeAccounts: number;
}

export function computeAccountStats(accountBalances: number[]): AccountStats {
  return accountBalances.reduce(
    (stats, balance) => {
      stats.totalBalance += balance;
      if (balance > 0) stats.positiveAccounts += 1;
      else if (balance < 0) stats.negativeAccounts += 1;
      return stats;
    },
    {
      totalBalance: 0,
      totalAccounts: accountBalances.length,
      positiveAccounts: 0,
      negativeAccounts: 0,
    }
  );
}

export interface DashboardBalanceViewModel {
  totalBalanceAll: number;
  totalBalanceByUserId: Record<string, number>;
}

/**
 * Precomputes dashboard total balance for "all" and each user (avoids client-side aggregation).
 */
export function computeDashboardBalanceViewModel(
  accounts: Account[],
  accountBalances: Record<string, number>,
  groupUserIds: string[],
  sharedSavingsAccountId?: string | null
): DashboardBalanceViewModel {
  const totalBalanceAll = roundMoney(
    Object.values(accountBalances).reduce((sum, bal) => sum + bal, 0)
  );

  const totalBalanceByUserId: Record<string, number> = {};
  for (const userId of groupUserIds) {
    const userAccountIds = accounts.filter((a) => a.user_ids.includes(userId)).map((a) => a.id);
    let balance = userAccountIds.reduce((sum, id) => sum + (accountBalances[id] || 0), 0);
    if (sharedSavingsAccountId) {
      balance += accountBalances[sharedSavingsAccountId] || 0;
    }
    totalBalanceByUserId[userId] = roundMoney(balance);
  }

  return { totalBalanceAll, totalBalanceByUserId };
}

/**
 * Precomputes account stats for filtered account sets (all users + per user).
 */
export function computeAccountsStatsViewModel(
  accounts: Account[],
  accountBalances: Record<string, number>,
  groupUserIds: string[]
): { all: AccountStats; byUserId: Record<string, AccountStats> } {
  const allBalances = accounts.map((a) => accountBalances[a.id] ?? 0);
  const byUserId: Record<string, AccountStats> = {};

  for (const userId of groupUserIds) {
    const balances = accounts
      .filter((a) => a.user_ids.includes(userId))
      .map((a) => accountBalances[a.id] ?? 0);
    byUserId[userId] = {
      ...computeAccountStats(balances),
      totalBalance: roundMoney(computeAccountStats(balances).totalBalance),
    };
  }

  const all = computeAccountStats(allBalances);
  return {
    all: { ...all, totalBalance: roundMoney(all.totalBalance) },
    byUserId,
  };
}
