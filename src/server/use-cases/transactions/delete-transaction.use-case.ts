import { db } from '@/server/db/drizzle';
import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import { validateId } from '@/lib/utils/validation-utils';
import { invalidateTransactionCaches } from '@/lib/utils/cache-utils';
import { applyTransactionBalanceAdjustments } from '@/server/use-cases/transactions/transaction-balance';
import type { TransactionScope } from '@/server/repositories/transactions.repository';

export async function deleteTransactionUseCase(
  id: string,
  scope?: TransactionScope
): Promise<{ id: string }> {
  validateId(id, 'Transaction ID');

  const existing = await TransactionsRepository.getById(id, scope);
  if (!existing) throw new Error('Transaction not found');

  await db.transaction(async (tx) => {
    await TransactionsRepository.delete(id, tx);
    await applyTransactionBalanceAdjustments(existing, -1, tx);
  });

  invalidateTransactionCaches({
    groupId: existing.group_id!,
    accountId: existing.account_id,
    userId: existing.user_id,
    toAccountId: existing.to_account_id,
  });

  return { id };
}

export async function deleteTransactionsByAccountUseCase(accountId: string): Promise<void> {
  if (!accountId?.trim()) throw new Error('Account ID is required');
  await TransactionsRepository.deleteByAccount(accountId);
}

export async function deleteTransactionsByUserUseCase(userId: string): Promise<void> {
  if (!userId?.trim()) throw new Error('User ID is required');
  await TransactionsRepository.deleteByUser(userId);
}
