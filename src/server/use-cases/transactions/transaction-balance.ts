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
  await applyBalanceDeltas(deltas, executor);
}

/** Apply the net change, acquiring all affected account row locks in one stable order. */
export async function applyTransactionBalanceUpdate(
  before: BalanceAdjustableRow,
  after: BalanceAdjustableRow,
  executor: DbExecutor
): Promise<void> {
  const deltas = computeBalanceDeltas(before, -1);
  for (const [id, delta] of computeBalanceDeltas(after, 1)) {
    deltas.set(id, (deltas.get(id) ?? 0) + delta);
  }
  await applyBalanceDeltas(deltas, executor);
}

async function applyBalanceDeltas(deltas: Map<string, number>, executor?: DbExecutor) {
  for (const [accountId, delta] of [...deltas].sort(([a], [b]) => a.localeCompare(b))) {
    if (delta === 0) continue;
    await TransactionsRepository.updateAccountBalance(accountId, delta, executor);
  }
}
