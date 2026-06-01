import { db } from '@/server/db/drizzle';
import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import type { UpdateTransactionInput } from '@/server/use-cases/transactions/types';
import type { Transaction } from '@/lib/types';
import { serialize } from '@/lib/utils/serializer';
import { invalidateTransactionUpdateCaches } from '@/lib/utils/cache-utils';
import { applyTransactionBalanceAdjustments } from '@/server/use-cases/transactions/transaction-balance';
import type { TransactionScope } from '@/server/repositories/transactions.repository';

export async function updateTransactionUseCase(
  id: string,
  data: UpdateTransactionInput,
  scope?: TransactionScope
): Promise<Transaction> {
  if (!id?.trim()) throw new Error('Transaction ID is required');

  const existing = await TransactionsRepository.getById(id, scope);
  if (!existing) throw new Error('Transaction not found');

  if (data.type === 'transfer' || existing.type === 'transfer') {
    const toAccountId = data.to_account_id ?? existing.to_account_id;
    const accountId = data.account_id ?? existing.account_id;
    if ((data.type || existing.type) === 'transfer' && !toAccountId) {
      throw new Error('Destination account is required for transfers');
    }
    if (toAccountId === accountId) {
      throw new Error('Source and destination accounts must be different');
    }
  }

  const updateData: Parameters<typeof TransactionsRepository.update>[1] = {};
  if (data.description !== undefined) updateData.description = data.description.trim();
  if (data.amount !== undefined) updateData.amount = data.amount.toString();
  if (data.type !== undefined) updateData.type = data.type;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.date !== undefined) {
    const d = typeof data.date === 'string' ? new Date(data.date) : data.date;
    updateData.date = d.toISOString().slice(0, 10);
  }
  if (data.user_id !== undefined) updateData.user_id = data.user_id;
  if (data.account_id !== undefined) updateData.account_id = data.account_id;
  if (data.to_account_id !== undefined) updateData.to_account_id = data.to_account_id;
  if (data.group_id !== undefined) updateData.group_id = data.group_id;

  const updated = await db.transaction(async (tx) => {
    const row = await TransactionsRepository.update(id, updateData, tx);
    if (!row) throw new Error('Failed to update transaction');
    await applyTransactionBalanceAdjustments(existing, -1, tx);
    await applyTransactionBalanceAdjustments(row, 1, tx);
    return row;
  });

  invalidateTransactionUpdateCaches(
    {
      userId: existing.user_id,
      accountId: existing.account_id,
      toAccountId: existing.to_account_id ?? null,
      groupId: existing.group_id ?? null,
    },
    {
      userId: updated.user_id,
      accountId: updated.account_id,
      toAccountId: updated.to_account_id ?? null,
      groupId: updated.group_id!,
    }
  );

  return serialize({
    ...updated,
    amount: Number(updated.amount),
  }) as Transaction;
}
