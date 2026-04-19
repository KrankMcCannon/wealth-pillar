import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import type { CreateTransactionInput } from '@/server/use-cases/transactions/types';
import type { Transaction } from '@/lib/types';
import { serialize } from '@/lib/utils/serializer';
import {
  validateId,
  validateRequiredString,
  validatePositiveNumber,
  validateEnum,
} from '@/lib/utils/validation-utils';
import { invalidateTransactionCaches } from '@/lib/utils/cache-utils';

export async function createTransactionUseCase(data: CreateTransactionInput): Promise<Transaction> {
  const description = validateRequiredString(data.description, 'Description');
  validatePositiveNumber(data.amount, 'Amount');
  validateEnum(data.type, ['income', 'expense', 'transfer'] as const, 'Transaction type');
  validateRequiredString(data.category, 'Category');
  validateId(data.account_id, 'Account');
  if (!data.date) throw new Error('Date is required');
  validateId(data.group_id, 'Group ID');

  if (data.type === 'transfer') {
    validateId(data.to_account_id, 'Destination account');
    if (data.to_account_id === data.account_id) {
      throw new Error('Source and destination accounts must be different');
    }
  }

  const transactionDate = typeof data.date === 'string' ? new Date(data.date) : data.date;

  const insertData = {
    description,
    amount: data.amount.toString(),
    type: data.type,
    category: data.category,
    date: transactionDate.toISOString().split('T')[0], // YYYY-MM-DD
    user_id: data.user_id || null,
    account_id: data.account_id,
    to_account_id: data.to_account_id || null,
    frequency: 'once',
    group_id: data.group_id,
  };

  const transaction = await TransactionsRepository.create(insertData);
  if (!transaction) throw new Error('Failed to create transaction');

  // Update balances
  const direction = 1;
  const amountNum = Number(transaction.amount);
  if (transaction.type === 'income') {
    await TransactionsRepository.updateAccountBalance(
      transaction.account_id!,
      amountNum * direction
    );
  } else if (transaction.type === 'expense') {
    await TransactionsRepository.updateAccountBalance(
      transaction.account_id!,
      -amountNum * direction
    );
  } else if (transaction.type === 'transfer' && transaction.to_account_id) {
    await TransactionsRepository.updateAccountBalance(
      transaction.account_id!,
      -amountNum * direction
    );
    await TransactionsRepository.updateAccountBalance(
      transaction.to_account_id,
      amountNum * direction
    );
  }

  // Cache invalidation
  invalidateTransactionCaches({
    groupId: data.group_id,
    accountId: data.account_id,
    userId: data.user_id,
    toAccountId: data.to_account_id ?? null,
  });

  return serialize({
    ...transaction,
    amount: Number(transaction.amount),
  }) as Transaction;
}
