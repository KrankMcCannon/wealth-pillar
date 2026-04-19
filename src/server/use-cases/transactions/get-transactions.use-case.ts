import { cached } from '@/lib/cache';
import { CACHE_TAGS, cacheOptions } from '@/lib/cache/config';
import { transactionCacheKeys } from '@/lib/cache/keys';
import { serialize } from '@/lib/utils/serializer';
import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import type { TransactionFilterOptions } from '@/server/repositories/transactions.repository';
import type { Transaction } from '@/lib/types';
import { db } from '@/server/db/drizzle';
import { transactions } from '@/server/db/schema';
import { count, eq } from 'drizzle-orm';

export async function getTransactionsByGroupUseCase(
  groupId: string,
  options?: TransactionFilterOptions
): Promise<{ data: Transaction[]; total: number; hasMore: boolean }> {
  if (!groupId?.trim()) throw new Error('Group ID is required');

  const result = await TransactionsRepository.getByGroup(groupId, options);

  return {
    data: serialize(
      result.data.map((t: (typeof result.data)[number]) => ({ ...t, amount: Number(t.amount) }))
    ) as Transaction[],
    total: result.total,
    hasMore: result.hasMore,
  };
}

export async function getTransactionsByUserUseCase(
  userId: string,
  options?: TransactionFilterOptions
): Promise<Transaction[]> {
  if (!userId?.trim()) throw new Error('User ID is required');

  const getCachedTransactions = cached(
    async () => {
      const result = await TransactionsRepository.getByUser(userId, options);
      return serialize(
        result.data.map((t: (typeof result.data)[number]) => ({ ...t, amount: Number(t.amount) }))
      ) as Transaction[];
    },
    transactionCacheKeys.byUser(userId),
    cacheOptions.transactionsByUser(userId)
  );

  return getCachedTransactions();
}

export async function getTransactionCountByUserUseCase(userId: string): Promise<number> {
  if (!userId?.trim()) throw new Error('User ID is required');

  const getCachedCount = cached(
    async () => {
      const result = await db
        .select({ value: count() })
        .from(transactions)
        .where(eq(transactions.user_id, userId));
      return result[0]?.value || 0;
    },
    [`user:${userId}:transactions:count`],
    { revalidate: 300, tags: [CACHE_TAGS.TRANSACTIONS, `user:${userId}:transactions`] }
  );

  return getCachedCount();
}

export async function getTransactionsByAccountUseCase(accountId: string): Promise<Transaction[]> {
  if (!accountId?.trim()) throw new Error('Account ID is required');

  const getCachedTransactions = cached(
    async () => {
      const data = await TransactionsRepository.getByAccount(accountId);
      return serialize(data.map((t) => ({ ...t, amount: Number(t.amount) }))) as Transaction[];
    },
    transactionCacheKeys.byAccount(accountId),
    cacheOptions.transactionsByAccount(accountId)
  );

  return getCachedTransactions();
}

export async function getTransactionByIdUseCase(transactionId: string): Promise<Transaction> {
  if (!transactionId?.trim()) throw new Error('Transaction ID is required');

  const getCachedTransaction = cached(
    async () => {
      const transaction = await TransactionsRepository.getById(transactionId);
      if (!transaction) throw new Error('Transaction not found');
      return serialize({ ...transaction, amount: Number(transaction.amount) }) as Transaction;
    },
    ['transaction', 'id', transactionId],
    { revalidate: 120, tags: [CACHE_TAGS.TRANSACTIONS, `transaction:${transactionId}`] }
  );

  return getCachedTransaction();
}
