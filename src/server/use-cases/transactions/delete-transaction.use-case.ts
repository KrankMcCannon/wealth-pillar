import { db } from '@/server/db/drizzle';
import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import { validateId } from '@/lib/utils/validation-utils';
import { invalidateTransactionCaches } from '@/lib/utils/cache-utils';
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
    const accountBalances = await TransactionsRepository.getAccountBalances(
      [removed.account_id, ...(removed.to_account_id ? [removed.to_account_id] : [])],
      tx
    );
    return { ...removed, accountBalances };
  });

  invalidateTransactionCaches({
    groupId: existing.group_id!,
    accountId: existing.account_id,
    userId: existing.user_id,
    toAccountId: existing.to_account_id,
    transactionId: existing.id,
  });

  return { id, accountBalances: existing.accountBalances };
}

export async function deleteTransactionsByAccountUseCase(accountId: string): Promise<void> {
  if (!accountId?.trim()) throw new Error('Account ID is required');
  await TransactionsRepository.deleteByAccount(accountId);
}

export async function deleteTransactionsByUserUseCase(userId: string): Promise<void> {
  if (!userId?.trim()) throw new Error('User ID is required');
  await TransactionsRepository.deleteByUser(userId);
}
