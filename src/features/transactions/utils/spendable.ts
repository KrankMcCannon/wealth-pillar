import type { Account, Transaction } from '@/lib/types';
import { isSpendableAccount } from '@/lib/utils/account-classification';
import { roundMoney } from '@/lib/utils/money';
import { accountsToMap, computeTransactionImpact } from '@/server/ledger';

export function currentSpendable(
  accounts: Account[],
  options?: { userId?: string | undefined; accountId?: string | undefined }
): number {
  const userId = options?.userId;
  const accountId =
    options?.accountId && options.accountId !== 'all' ? options.accountId : undefined;
  let total = 0;
  for (const account of accounts) {
    if (accountId && account.id !== accountId) continue;
    if (userId && !account.user_ids.includes(userId)) continue;
    if (accountId) {
      total += Number(account.balance) || 0;
      continue;
    }
    if (!isSpendableAccount(account)) continue;
    total += Number(account.balance) || 0;
  }
  return roundMoney(total);
}

export function spendableByDay(
  newestFirstDays: Array<{ isoDate: string; transactions: Transaction[] }>,
  spendableNow: number,
  accounts: Account[]
): Map<string, number> {
  const map = new Map<string, number>();
  const accountMap = accountsToMap(accounts);
  let remaining = spendableNow;
  for (const day of newestFirstDays) {
    map.set(day.isoDate, remaining);
    let dayNet = 0;
    for (const transaction of day.transactions) {
      dayNet += computeTransactionImpact(transaction, accountMap).spendableDelta;
    }
    remaining = roundMoney(remaining - dayNet);
  }
  return map;
}
