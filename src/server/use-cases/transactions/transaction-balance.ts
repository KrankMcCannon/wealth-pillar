import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import type { DbExecutor } from '@/server/repositories/db-executor';
import { computeExactBalanceDeltas } from './transaction-balance-delta.core';

export type BalanceAdjustableRow = {
  amount: string | number | null;
  type: string | null;
  account_id: string | null;
  to_account_id?: string | null;
};

export async function applyTransactionBalanceAdjustments(
  transaction: BalanceAdjustableRow,
  multiplier: number,
  executor: DbExecutor
): Promise<void> {
  const deltas = computeExactBalanceDeltas(transaction, multiplier);
  await applyBalanceDeltas(deltas, executor);
}

/** Apply the net change, acquiring all affected account row locks in one stable order. */
export async function applyTransactionBalanceUpdate(
  before: BalanceAdjustableRow,
  after: BalanceAdjustableRow,
  executor: DbExecutor
): Promise<void> {
  const deltas = computeExactBalanceDeltas(before, -1);
  for (const [id, delta] of computeExactBalanceDeltas(after, 1)) {
    deltas.set(id, (deltas.get(id) ?? BigInt(0)) + delta);
  }
  await applyBalanceDeltas(deltas, executor);
}

export async function applyBalanceDeltas(deltas: Map<string, bigint>, executor: DbExecutor) {
  for (const [accountId, delta] of [...deltas].sort(([a], [b]) => a.localeCompare(b))) {
    if (delta === BigInt(0)) continue;
    await TransactionsRepository.updateAccountBalance(accountId, delta, executor);
  }
}
