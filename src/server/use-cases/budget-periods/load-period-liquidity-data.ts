import type { Account, Transaction } from '@/lib/types';
import { transactions } from '@/server/db/schema';
import type { DateWindow } from '../reports/report.logic';
import type { DbExecutor } from '@/server/repositories/db-executor';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import { UsersRepository } from '@/server/repositories/users.repository';

/** Complete group ledger for financial calculations, independent of display pagination. */
export async function loadPeriodLiquidityData(
  groupId: string | null | undefined,
  userId: string,
  window?: DateWindow,
  executor?: DbExecutor
): Promise<{ transactions: Transaction[]; accounts: Account[] }> {
  const resolved = groupId?.trim() || (await UsersRepository.findById(userId))?.group_id || '';
  if (!resolved) throw new Error('Group ID is required');

  const [result, accounts] = await Promise.all([
    TransactionsRepository.getByGroup(
      resolved,
      { ...(window ? { startDate: window.start, endDate: window.end } : {}), countTotal: false },
      executor
    ),
    AccountsRepository.findByGroup(resolved, executor),
  ]);

  if (result.hasMore) throw new Error('Cannot calculate a snapshot from an incomplete ledger');

  return {
    transactions: result.data.map((row: typeof transactions.$inferSelect) => ({
      ...row,
      amount: Number(row.amount),
    })) as Transaction[],
    accounts,
  };
}
