import type { Account } from '@/lib/types';
import { roundMoney } from '@/lib/utils/money';
import { resolveAccountLiquidity } from '@/lib/utils/account-classification';

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
  spendableBalance: number;
  reserveBalance: number;
  totalAccounts: number;
  positiveAccounts: number;
  negativeAccounts: number;
}

export function computeAccountStats(
  accounts: Account[],
  accountBalances: Record<string, number>
): AccountStats {
  let spendableBalance = 0;
  let reserveBalance = 0;
  let positiveAccounts = 0;
  let negativeAccounts = 0;

  for (const account of accounts) {
    const balance = accountBalances[account.id] ?? 0;
    if (resolveAccountLiquidity(account) === 'reserve') {
      reserveBalance += balance;
    } else {
      spendableBalance += balance;
    }
    if (balance > 0) positiveAccounts += 1;
    else if (balance < 0) negativeAccounts += 1;
  }

  const totalBalance = spendableBalance + reserveBalance;

  return {
    totalBalance: roundMoney(totalBalance),
    spendableBalance: roundMoney(spendableBalance),
    reserveBalance: roundMoney(reserveBalance),
    totalAccounts: accounts.length,
    positiveAccounts,
    negativeAccounts,
  };
}

export interface DashboardBalanceViewModel {
  totalBalanceAll: number;
  spendableBalanceAll: number;
  reserveBalanceAll: number;
  totalBalanceByUserId: Record<string, number>;
  spendableByUserId: Record<string, number>;
  reserveByUserId: Record<string, number>;
}

function sumUserBalances(
  accounts: Account[],
  accountBalances: Record<string, number>,
  userId: string
): { spendable: number; reserve: number } {
  let spendable = 0;
  let reserve = 0;
  for (const account of accounts) {
    if (!account.user_ids.includes(userId)) continue;
    const balance = accountBalances[account.id] ?? 0;
    if (resolveAccountLiquidity(account) === 'reserve') {
      reserve += balance;
    } else {
      spendable += balance;
    }
  }
  return { spendable: roundMoney(spendable), reserve: roundMoney(reserve) };
}

/**
 * Precomputes dashboard balances for "all" and each user (spendable vs reserve).
 */
export function computeDashboardBalanceViewModel(
  accounts: Account[],
  accountBalances: Record<string, number>,
  groupUserIds: string[]
): DashboardBalanceViewModel {
  const allStats = computeAccountStats(accounts, accountBalances);

  const totalBalanceByUserId: Record<string, number> = {};
  const spendableByUserId: Record<string, number> = {};
  const reserveByUserId: Record<string, number> = {};

  for (const userId of groupUserIds) {
    const { spendable, reserve } = sumUserBalances(accounts, accountBalances, userId);
    spendableByUserId[userId] = spendable;
    reserveByUserId[userId] = reserve;
    totalBalanceByUserId[userId] = roundMoney(spendable + reserve);
  }

  return {
    totalBalanceAll: allStats.totalBalance,
    spendableBalanceAll: allStats.spendableBalance,
    reserveBalanceAll: allStats.reserveBalance,
    totalBalanceByUserId,
    spendableByUserId,
    reserveByUserId,
  };
}

/**
 * Precomputes account stats for filtered account sets (all users + per user).
 */
export function computeAccountsStatsViewModel(
  accounts: Account[],
  accountBalances: Record<string, number>,
  groupUserIds: string[]
): { all: AccountStats; byUserId: Record<string, AccountStats> } {
  const all = computeAccountStats(accounts, accountBalances);
  const byUserId: Record<string, AccountStats> = {};

  for (const userId of groupUserIds) {
    const userAccounts = accounts.filter((a) => a.user_ids.includes(userId));
    byUserId[userId] = computeAccountStats(userAccounts, accountBalances);
  }

  return { all, byUserId };
}
