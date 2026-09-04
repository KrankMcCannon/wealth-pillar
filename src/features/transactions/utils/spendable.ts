import type { Account, Transaction } from '@/lib/types';
import { isSpendableAccount } from '@/lib/utils/account-classification';
import { roundMoney } from '@/lib/utils/money';

export function signedDelta(transaction: Transaction): number {
  const amount = Math.abs(Number(transaction.amount) || 0);
  if (transaction.type === 'income') return amount;
  if (transaction.type === 'expense') return -amount;
  return 0;
}

export function currentSpendable(
  accounts: Account[],
  options?: { userId?: string | undefined; accountId?: string | undefined }
): number {
  const userId = options?.userId;
  const accountId = options?.accountId && options.accountId !== 'all' ? options.accountId : undefined;
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

function affectsSpendable(transaction: Transaction, accounts: Account[]): boolean {
  const account = accounts.find((item) => item.id === transaction.account_id);
  if (!account) return transaction.type !== 'transfer';
  return isSpendableAccount(account);
}

/**
 * ponytail: live spendable from account.balance; rewind loaded days only.
 * Newest day = current spendable; older day = that amount minus newer days' spendable net.
 */
export function spendableByDay(
  newestFirstDays: Array<{ isoDate: string; transactions: Transaction[] }>,
  spendableNow: number,
  accounts: Account[]
): Map<string, number> {
  const map = new Map<string, number>();
  let remaining = spendableNow;
  for (const day of newestFirstDays) {
    map.set(day.isoDate, remaining);
    let dayNet = 0;
    for (const transaction of day.transactions) {
      if (!affectsSpendable(transaction, accounts)) continue;
      dayNet += signedDelta(transaction);
    }
    remaining = roundMoney(remaining - dayNet);
  }
  return map;
}
