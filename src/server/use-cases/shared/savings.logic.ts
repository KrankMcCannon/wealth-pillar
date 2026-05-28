import type { Account, DateString, Transaction } from '@/lib/types';
import { roundMoney } from '@/lib/utils/money';
import { resolveAccountLiquidity } from '@/lib/utils/account-classification';
import type { DateWindow } from '../reports/report.logic';

export interface NetSavingsResult {
  deposits: number;
  withdrawals: number;
  net: number;
}

function isInWindow(date: DateString, window: DateWindow): boolean {
  const t = new Date(date).getTime();
  return t >= window.start.getTime() && t <= window.end.getTime();
}

export function classifyTransferSavingsDelta(
  source: Pick<Account, 'type' | 'liquidity'>,
  dest: Pick<Account, 'type' | 'liquidity'>,
  amount: number
): number {
  const from = resolveAccountLiquidity(source);
  const to = resolveAccountLiquidity(dest);
  if (from === 'spendable' && to === 'reserve') return amount;
  if (from === 'reserve' && to === 'spendable') return -amount;
  return 0;
}

export function computeNetSavings(
  transactions: Transaction[],
  accounts: Account[],
  window: DateWindow,
  userId?: string
): NetSavingsResult {
  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  let deposits = 0;
  let withdrawals = 0;

  for (const tx of transactions) {
    if (tx.type !== 'transfer' || !tx.to_account_id) continue;
    if (userId !== undefined && tx.user_id !== userId) continue;
    if (!isInWindow(tx.date, window)) continue;

    const source = accountMap.get(tx.account_id);
    const dest = accountMap.get(tx.to_account_id);
    if (!source || !dest) continue;

    const delta = classifyTransferSavingsDelta(source, dest, tx.amount);
    if (delta > 0) deposits += delta;
    else if (delta < 0) withdrawals += Math.abs(delta);
  }

  return {
    deposits: roundMoney(deposits),
    withdrawals: roundMoney(withdrawals),
    net: roundMoney(deposits - withdrawals),
  };
}
