import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import { validateId } from '@/lib/utils/validation-utils';
import { invalidateTransactionCaches } from '@/lib/utils/cache-utils';

export async function deleteTransactionUseCase(id: string): Promise<{ id: string }> {
  validateId(id, 'Transaction ID');

  const existing = await TransactionsRepository.getById(id);
  if (!existing) throw new Error('Transaction not found');

  await TransactionsRepository.delete(id);

  // Reverse balances (-1 direction)
  const amt = Number(existing.amount);
  if (existing.type === 'income') {
    await TransactionsRepository.updateAccountBalance(existing.account_id!, -amt);
  } else if (existing.type === 'expense') {
    await TransactionsRepository.updateAccountBalance(existing.account_id!, amt);
  } else if (existing.type === 'transfer' && existing.to_account_id) {
    await TransactionsRepository.updateAccountBalance(existing.account_id!, amt);
    await TransactionsRepository.updateAccountBalance(existing.to_account_id, -amt);
  }

  invalidateTransactionCaches({
    groupId: existing.group_id!,
    accountId: existing.account_id!,
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
