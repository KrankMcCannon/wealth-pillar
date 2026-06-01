import { cacheLife, cacheTag } from 'next/cache';
import { getAccountsByGroupDeduped } from '@/server/request-cache/services';
import { computeAccountsStatsViewModel, type AccountStats } from '../accounts/account.logic';
import type { Account, Transaction, User } from '@/lib/types';
import { scopeAccountsPageData } from '@/server/permissions/scope-page-data';

export interface AccountsPageData {
  accounts: Account[];
  transactions: Transaction[];
  accountBalances: Record<string, number>;
  statsAll: AccountStats;
  statsByUserId: Record<string, AccountStats>;
}

async function getCachedAccountsPageData(
  groupId: string,
  groupUserIds: string[] = []
): Promise<AccountsPageData> {
  'use cache';
  cacheLife('minutes');
  cacheTag(`group:${groupId}:accounts`);
  cacheTag('accounts');

  const accounts = await getAccountsByGroupDeduped(groupId).catch(() => [] as Account[]);

  const accountBalances: Record<string, number> = {};
  for (const account of accounts) {
    accountBalances[account.id] = account.balance ?? 0;
  }

  const userIds =
    groupUserIds.length > 0 ? groupUserIds : [...new Set(accounts.flatMap((a) => a.user_ids))];

  const { all: statsAll, byUserId: statsByUserId } = computeAccountsStatsViewModel(
    accounts,
    accountBalances,
    userIds
  );

  return {
    accounts,
    transactions: [],
    accountBalances,
    statsAll,
    statsByUserId,
  };
}

export async function getAccountsPageData(
  groupId: string,
  groupUserIds: string[] = [],
  currentUser: User
): Promise<AccountsPageData> {
  const data = await getCachedAccountsPageData(groupId, groupUserIds);
  return scopeAccountsPageData(data, currentUser);
}
