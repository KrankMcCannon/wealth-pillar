import { db } from '@/server/db/drizzle';
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
import { applyTransactionBalanceAdjustments } from '@/server/use-cases/transactions/transaction-balance';

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
    date: transactionDate.toISOString().slice(0, 10),
    user_id: data.user_id || null,
    account_id: data.account_id,
    to_account_id: data.to_account_id || null,
    frequency: 'once',
    group_id: data.group_id,
  };

  const transaction = await db.transaction(async (tx) => {
    const created = await TransactionsRepository.create(insertData, tx);
    if (!created) throw new Error('Failed to create transaction');
    await applyTransactionBalanceAdjustments(created, 1, tx);
    return created;
  });

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
