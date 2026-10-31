import type { Transaction } from '@/lib/types';
import { TransactionLogic } from '@/lib/utils/transaction-logic';
import { formatDateSmart, toDateTime } from '@/lib/utils/date-utils';
import { computeBalanceDeltas } from '@/server/use-cases/transactions/transaction-balance-delta.core';
import { roundMoney } from '@/lib/utils/money';

export interface DayGroup {
  isoDate: string;
  formattedDate: string;
  transactions: Transaction[];
  income: number;
  expense: number;
  net: number;
}

export function groupByDay(
  transactions: Transaction[],
  locale: string,
  accountId?: string
): DayGroup[] {
  const grouped: Record<string, Transaction[]> = {};

  for (const tx of transactions) {
    const dt = toDateTime(tx.date);
    const iso = dt?.toISODate();
    if (!iso) continue;
    if (!grouped[iso]) grouped[iso] = [];
    grouped[iso].push(tx);
  }

  const dailyTotals = TransactionLogic.calculateDailyTotals(grouped);

  return Object.entries(grouped)
    .map(([iso, txs]) => ({
      isoDate: iso,
      formattedDate: formatDateSmart(iso, locale),
      transactions: txs,
      income: dailyTotals[iso]?.income ?? 0,
      expense: dailyTotals[iso]?.expense ?? 0,
      net: roundMoney(
        (dailyTotals[iso]?.income ?? 0) -
          (dailyTotals[iso]?.expense ?? 0) +
          (accountId && accountId !== 'all'
            ? txs
                .filter((tx) => tx.type === 'transfer')
                .reduce((sum, tx) => sum + (computeBalanceDeltas(tx, 1).get(accountId) ?? 0), 0)
            : 0)
      ),
    }))
    .sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime());
}
