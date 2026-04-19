import { getAccountsByGroupDeduped } from '@/server/request-cache/services';
import type { Account, Transaction } from '@/lib/types';

export interface AccountsPageData {
  accounts: Account[];
  transactions: Transaction[];
  accountBalances: Record<string, number>;
}

export async function getAccountsPageData(groupId: string): Promise<AccountsPageData> {
  const accounts = await getAccountsByGroupDeduped(groupId).catch(() => [] as Account[]);

  const accountBalances: Record<string, number> = {};
  for (const account of accounts) {
    accountBalances[account.id] = account.balance ?? 0;
  }

  return {
    accounts,
    transactions: [], // Not needed for accounts page balance display
    accountBalances,
  };
}
