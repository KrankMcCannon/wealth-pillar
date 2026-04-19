import { getTransactionsByGroupUseCase } from '../transactions/get-transactions.use-case';
import {
  getAccountsByGroupDeduped,
  getAllCategoriesDeduped,
} from '@/server/request-cache/services';
import { getSeriesByGroupUseCase } from '../recurring/recurring.use-cases';
import { getBudgetsByGroupUseCase } from '../budgets/get-budgets.use-case';
import type {
  Transaction,
  Category,
  Account,
  RecurringTransactionSeries,
  Budget,
} from '@/lib/types';

export interface TransactionsPageData {
  transactions: Transaction[];
  total: number;
  hasMore: boolean;
  categories: Category[];
  accounts: Account[];
  recurringSeries: RecurringTransactionSeries[];
  budgets: Budget[];
}

async function safeFetch<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (e) {
    console.error(`[TransactionsPageUseCase] Fetch failed:`, e);
    return fallback;
  }
}

export async function getTransactionsPageData(
  groupId: string,
  options?: { limit?: number; offset?: number }
): Promise<TransactionsPageData> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const [transactionResult, categories, accounts, recurringSeries, budgets] = await Promise.all([
    safeFetch(getTransactionsByGroupUseCase(groupId, { limit, offset }), {
      data: [] as Transaction[],
      total: 0,
      hasMore: false,
    }),
    safeFetch(getAllCategoriesDeduped(), [] as Category[]),
    safeFetch(getAccountsByGroupDeduped(groupId), [] as Account[]),
    safeFetch(getSeriesByGroupUseCase(groupId), [] as RecurringTransactionSeries[]),
    safeFetch(getBudgetsByGroupUseCase(groupId), [] as Budget[]),
  ]);

  return {
    transactions: transactionResult.data,
    total: transactionResult.total,
    hasMore: transactionResult.hasMore,
    categories,
    accounts,
    recurringSeries,
    budgets,
  };
}
