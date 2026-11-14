import { withDatabaseOperation } from '@/server/db/telemetry';
import { cacheLife, cacheTag } from 'next/cache';
import { getAccountsByGroupDeduped } from '@/server/request-cache/services';
import { computeAccountsStatsViewModel, type AccountStats } from '../accounts/account.logic';
import type { Account, Category, Transaction, User } from '@/lib/types';
import { scopeAccountsPageData } from '@/server/permissions/scope-page-data';
import { getTransactionsListData } from './transactions-page.use-case';

export interface AccountsPageData {
  accounts: Account[];
  accountBalances: Record<string, number>;
  statsAll: AccountStats;
  statsByUserId: Record<string, AccountStats>;
}

export interface AccountDetailPageData {
  account: Account;
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
}

/** Resolve visibility before querying an account's ledger, including direct URLs. */
export async function getAccountDetailPageData(
  groupId: string,
  accountId: string,
  currentUser: User,
  selectedUserId?: string
): Promise<AccountDetailPageData> {
  if (currentUser.group_id !== groupId) throw new Error('NOT_FOUND');
  const { accounts } = await getAccountsPageData(groupId, [], currentUser);
  const account = accounts.find(
    (candidate) => candidate.id === accountId && candidate.group_id === groupId
  );
  if (!account) throw new Error('NOT_FOUND');

  const effectiveUserId = currentUser.role === 'member' ? currentUser.id : selectedUserId;
  const ledger = await getTransactionsListData(
    groupId,
    {
      account: accountId,
      ...(effectiveUserId && effectiveUserId !== 'all' ? { user: effectiveUserId } : {}),
    },
    currentUser
  );
  return {
    account,
    accounts,
    transactions: ledger.transactions.slice(0, 10),
    categories: ledger.categories,
  };
}

async function getCachedAccountsPageData(
  groupId: string,
  groupUserIds: string[] = []
): Promise<AccountsPageData> {
  'use cache';
  cacheLife('minutes');
  cacheTag(`group:${groupId}:accounts`);
  cacheTag('accounts');

  const accounts = await getAccountsByGroupDeduped(groupId);

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
  const data = await withDatabaseOperation('accounts', () =>
    getCachedAccountsPageData(groupId, groupUserIds)
  );
  return scopeAccountsPageData(data, currentUser);
}
