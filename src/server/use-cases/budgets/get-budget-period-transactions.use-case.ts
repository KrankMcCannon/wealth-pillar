import type { BudgetPeriod, Transaction } from '@/lib/types';
import { parsePeriodDates } from '../shared/period.logic';
import { getCompletePeriodTransactionsUseCase } from '../transactions/get-transactions.use-case';

/** Financial calculations use the complete active-period ledger, independently of activity lists. */
export async function getBudgetPeriodTransactionsUseCase(
  groupId: string,
  userIds: string[],
  periods: Record<string, BudgetPeriod | null>,
  now = new Date()
): Promise<Transaction[]> {
  if (!userIds.length) return [];
  const windows = userIds.map((id) => parsePeriodDates(periods[id], now));
  return getCompletePeriodTransactionsUseCase(
    groupId,
    new Date(Math.min(...windows.map(([start]) => start.toMillis()))),
    new Date(Math.max(...windows.map(([, end]) => end.toMillis())))
  );
}
