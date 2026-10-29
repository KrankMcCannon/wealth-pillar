import type { BudgetPeriod, Transaction } from '@/lib/types';
import { BUDGETS_TRANSACTIONS_OVERFLOW } from '@/server/db/query-limits';
import { parsePeriodDates } from '../shared/period.logic';
import { getTransactionsByGroupUseCase } from '../transactions/get-transactions.use-case';

/** Financial calculations use the complete active-period ledger, independently of activity lists. */
export async function getBudgetPeriodTransactionsUseCase(
  groupId: string,
  userIds: string[],
  periods: Record<string, BudgetPeriod | null>,
  now = new Date()
): Promise<Transaction[]> {
  if (!userIds.length) return [];
  const windows = userIds.map((id) => parsePeriodDates(periods[id], now));
  const result = await getTransactionsByGroupUseCase(groupId, {
    startDate: new Date(Math.min(...windows.map(([start]) => start.toMillis()))),
    endDate: new Date(Math.max(...windows.map(([, end]) => end.toMillis()))),
    countTotal: false,
  });
  if (result.hasMore) throw new Error(BUDGETS_TRANSACTIONS_OVERFLOW);
  return result.data;
}
