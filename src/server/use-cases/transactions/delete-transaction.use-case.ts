import { db } from '@/server/db/drizzle';
import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import { validateId } from '@/lib/utils/validation-utils';
import { invalidateTransactionCaches } from '@/lib/utils/cache-utils';
import { applyBalanceDeltas } from './transaction-balance';
import { computeBalanceDeltas } from './transaction-balance-delta.core';
import type { DbExecutor } from '@/server/repositories/db-executor';
import { applyTransactionBalanceAdjustments } from '@/server/use-cases/transactions/transaction-balance';
import type { TransactionScope } from '@/server/repositories/transactions.repository';
import type { TransactionDeleteResult } from '@/lib/types/financial-mutation';

export async function deleteTransactionUseCase(
  id: string,
  scope?: TransactionScope
): Promise<TransactionDeleteResult> {
  validateId(id, 'Transaction ID');

  const existing = await db.transaction(async (tx) => {
    const removed = await TransactionsRepository.delete(id, tx, scope);
    if (!removed) throw new Error('Transaction not found');
    await applyTransactionBalanceAdjustments(removed, -1, tx);
    const { accountBalances, accountBalanceVersions } =
      await TransactionsRepository.getAccountBalanceState(
        [removed.account_id, ...(removed.to_account_id ? [removed.to_account_id] : [])],
        tx
      );
    return { ...removed, accountBalances, accountBalanceVersions };
  });

  invalidateTransactionCaches({
    groupId: existing.group_id!,
    accountId: existing.account_id,
    userId: existing.user_id,
    toAccountId: existing.to_account_id,
    transactionId: existing.id,
  });

  return {
    id,
    accountBalances: existing.accountBalances,
    accountBalanceVersions: existing.accountBalanceVersions,
  };
}

export async function deleteTransactionsByAccountUseCase(accountId: string): Promise<void> {
  if (!accountId?.trim()) throw new Error('Account ID is required');
  await deleteLedgerRows((tx) => TransactionsRepository.deleteByAccount(accountId, tx));
}

export async function deleteTransactionsByUserUseCase(userId: string): Promise<void> {
  if (!userId?.trim()) throw new Error('User ID is required');
  await deleteLedgerRows((tx) => TransactionsRepository.deleteByUser(userId, tx));
}

async function deleteLedgerRows(
  remove: (tx: DbExecutor) => ReturnType<typeof TransactionsRepository.deleteByAccount>
): Promise<void> {
  const removed = await db.transaction(async (tx) => {
    const rows = await remove(tx);
    const deltas = new Map<string, number>();
    for (const row of rows)
      for (const [id, delta] of computeBalanceDeltas(row, -1))
        deltas.set(id, (deltas.get(id) ?? 0) + delta);
    await applyBalanceDeltas(deltas, tx);
    return rows;
  });
  const affected = new Map(
    removed.map((row) => [
      JSON.stringify([row.group_id, row.account_id, row.to_account_id, row.user_id]),
      row,
    ])
  );
  for (const row of affected.values())
    invalidateTransactionCaches({
      groupId: row.group_id!,
      accountId: row.account_id,
      toAccountId: row.to_account_id,
      userId: row.user_id,
    });
}
