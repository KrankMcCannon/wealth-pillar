import type { Account, Transaction } from '@/lib/types';
import { transactions } from '@/server/db/schema';
import { REPORTS_TRANSACTIONS_LIMIT } from '@/server/db/query-limits';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import { UsersRepository } from '@/server/repositories/users.repository';

/** Group ledger + accounts. Snapshot writes must not use recorder-only rows. */
export async function loadPeriodLiquidityData(
  groupId: string | null | undefined,
  userId: string
): Promise<{ transactions: Transaction[]; accounts: Account[] }> {
  const resolved =
    groupId?.trim() || (await UsersRepository.findById(userId))?.group_id || '';
  if (!resolved) throw new Error('Group ID is required');

  const [result, accounts] = await Promise.all([
    TransactionsRepository.getByGroup(resolved, {
      limit: REPORTS_TRANSACTIONS_LIMIT,
      countTotal: false,
    }),
    AccountsRepository.findByGroup(resolved),
  ]);

  return {
    transactions: result.data.map((row: typeof transactions.$inferSelect) => ({
      ...row,
      amount: Number(row.amount),
    })) as Transaction[],
    accounts,
  };
}
