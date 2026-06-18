import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import type { DbExecutor } from '@/server/repositories/db-executor';
import { computeBalanceDeltas } from './transaction-balance-delta.core';

export type BalanceAdjustableRow = {
  amount: string | number | null;
  type: string | null;
  account_id: string | null;
  to_account_id?: string | null;
};

export async function applyTransactionBalanceAdjustments(
  transaction: BalanceAdjustableRow,
  multiplier: number,
  executor?: DbExecutor
): Promise<void> {
  const deltas = computeBalanceDeltas(transaction, multiplier);
  for (const [accountId, delta] of deltas) {
    await TransactionsRepository.updateAccountBalance(accountId, delta, executor);
  }
}
