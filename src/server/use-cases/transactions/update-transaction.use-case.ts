import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import type { UpdateTransactionInput } from '@/server/use-cases/transactions/types';
import type { Transaction } from '@/lib/types';
import { serialize } from '@/lib/utils/serializer';
import { invalidateTransactionUpdateCaches } from '@/lib/utils/cache-utils';

export async function updateTransactionUseCase(
  id: string,
  data: UpdateTransactionInput
): Promise<Transaction> {
  if (!id?.trim()) throw new Error('Transaction ID is required');

  const existing = await TransactionsRepository.getById(id);
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
    updateData.date = d.toISOString().split('T')[0];
  }
  if (data.user_id !== undefined) updateData.user_id = data.user_id;
  if (data.account_id !== undefined) updateData.account_id = data.account_id;
  if (data.to_account_id !== undefined) updateData.to_account_id = data.to_account_id;
  if (data.group_id !== undefined) updateData.group_id = data.group_id;

  const updated = await TransactionsRepository.update(id, updateData);
  if (!updated) throw new Error('Failed to update transaction');

  // Re-adjust balances
  async function adjustBalance(transaction: Transaction | any, multiplier: number) {
    const amt = Number(transaction.amount) * multiplier;
    if (transaction.type === 'income') {
      await TransactionsRepository.updateAccountBalance(transaction.account_id, amt);
    } else if (transaction.type === 'expense') {
      await TransactionsRepository.updateAccountBalance(transaction.account_id, -amt);
    } else if (transaction.type === 'transfer' && transaction.to_account_id) {
      await TransactionsRepository.updateAccountBalance(transaction.account_id, -amt);
      await TransactionsRepository.updateAccountBalance(transaction.to_account_id, amt);
    }
  }

  // Reverse old effect (-1)
  await adjustBalance(existing, -1);
  // Apply new effect (1)
  await adjustBalance(updated, 1);

  invalidateTransactionUpdateCaches(
    {
      userId: existing.user_id,
      accountId: existing.account_id!,
      toAccountId: existing.to_account_id ?? null,
      groupId: existing.group_id ?? null,
    },
    {
      userId: updated.user_id,
      accountId: updated.account_id!,
      toAccountId: updated.to_account_id ?? null,
      groupId: updated.group_id!,
    }
  );

  return serialize({
    ...updated,
    amount: Number(updated.amount),
  }) as Transaction;
}
