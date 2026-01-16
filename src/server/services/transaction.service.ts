import 'server-only';
import { CACHE_TAGS, cached, cacheOptions, transactionCacheKeys } from '@/lib/cache';
export { TransactionLogic } from './transaction.logic';
import { TransactionRepository } from '@/server/dal';
import type { CategoryBreakdownItem, Transaction, TransactionType } from '@/lib/types';
import {
  formatDateSmart,
  toDateTime,
} from '@/lib/utils/date-utils';
import { FinanceLogicService } from './finance-logic.service';
import { revalidateTag } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { serialize } from '@/lib/utils/serializer';

/**
 * Report metrics calculated from transactions
 */
export interface ReportMetrics {
  income: number;
  expenses: number;
  netSavings: number;
  savingsRate: number;
  categories: CategoryMetric[];
}

/**
 * Category spending metrics
 */
export interface CategoryMetric {
  name: string;
  amount: number;
  percentage: number;
  trend?: 'up' | 'down' | 'stable';
}

/**
 * Input data for creating a new transaction
 */
export interface CreateTransactionInput {
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string | Date;
  user_id: string | null;
  account_id: string;
  to_account_id?: string | null;
  group_id: string;
  frequency?: string;
  recurring_series_id?: string;
}

/**
 * Input data for updating an existing transaction
 */
export type UpdateTransactionInput = Partial<CreateTransactionInput>;

/**
 * Service result type used across services
 */
export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}


/**
 * Transaction Service
 * Handles all transaction-related business logic following Single Responsibility Principle
 *
 * All methods return ServiceResult for consistent error handling
 * All database queries are cached using Next.js unstable_cache
 */
export class TransactionService {
  /**
   * Retrieves all transactions for a specific group
   */
  static async getTransactionsByGroup(
    groupId: string
  ): Promise<ServiceResult<Transaction[]>> {
    try {
      if (!groupId || groupId.trim() === '') {
        return {
          data: null,
          error: 'Group ID is required',
        };
      }

      const getCachedTransactions = cached(
        async () => {
          const transactions = await TransactionRepository.getByGroup(groupId);
          return serialize(transactions) as unknown as Transaction[];
        },
        transactionCacheKeys.byGroup(groupId),
        cacheOptions.transactionsByGroup(groupId)
      );

      const transactions = await getCachedTransactions();

      return {
        data: transactions,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve group transactions',
      };
    }
  }

  /**
   * Retrieves all transactions for a specific user
   */
  static async getTransactionsByUser(
    userId: string
  ): Promise<ServiceResult<Transaction[]>> {
    try {
      if (!userId || userId.trim() === '') {
        return {
          data: null,
          error: 'User ID is required',
        };
      }

      const getCachedTransactions = cached(
        async () => {
          const result = await TransactionRepository.getByUser(userId);
          // Assuming result.data is the array of transactions
          return serialize(result.data || []) as unknown as Transaction[];
        },
        transactionCacheKeys.byUser(userId),
        cacheOptions.transactionsByUser(userId)
      );

      const transactions = await getCachedTransactions();

      return {
        data: transactions,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve user transactions',
      };
    }
  }

  /**
   * Retrieves all transactions for a specific account
   */
  static async getTransactionsByAccount(
    accountId: string
  ): Promise<ServiceResult<Transaction[]>> {
    try {
      if (!accountId || accountId.trim() === '') {
        return {
          data: null,
          error: 'Account ID is required',
        };
      }

      const getCachedTransactions = cached(
        async () => {
          const transactions = await TransactionRepository.getByAccount(accountId);
          return serialize(transactions || []) as unknown as Transaction[];
        },
        transactionCacheKeys.byAccount(accountId),
        cacheOptions.transactionsByAccount(accountId)
      );

      const transactions = await getCachedTransactions();

      return {
        data: transactions,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve account transactions',
      };
    }
  }

  /**
   * Get a single transaction by ID
   */
  static async getTransactionById(
    transactionId: string
  ): Promise<ServiceResult<Transaction>> {
    try {
      if (!transactionId || transactionId.trim() === '') {
        return { data: null, error: 'Transaction ID is required' };
      }

      const getCachedTransaction = cached(
        async () => {
          const transaction = await TransactionRepository.getById(transactionId);
          if (!transaction) throw new Error('Transaction not found');
          return serialize(transaction) as unknown as Transaction;
        },
        ['transaction', 'id', transactionId],
        {
          revalidate: 120,
          tags: [CACHE_TAGS.TRANSACTIONS, `transaction:${transactionId}`],
        }
      );

      const transaction = await getCachedTransaction();

      return {
        data: transaction,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve transaction',
      };
    }
  }

  /**
   * Create a new transaction
   */
  static async createTransaction(
    data: CreateTransactionInput
  ): Promise<ServiceResult<Transaction>> {
    try {
      if (!data.description || data.description.trim() === '') {
        return { data: null, error: 'Description is required' };
      }

      if (!data.amount || data.amount <= 0) {
        return { data: null, error: 'Amount must be greater than zero' };
      }

      if (!data.type) {
        return { data: null, error: 'Transaction type is required' };
      }

      if (!['income', 'expense', 'transfer'].includes(data.type)) {
        return { data: null, error: 'Invalid transaction type' };
      }

      if (!data.category || data.category.trim() === '') {
        return { data: null, error: 'Category is required' };
      }

      if (!data.account_id || data.account_id.trim() === '') {
        return { data: null, error: 'Account is required' };
      }

      if (!data.date) {
        return { data: null, error: 'Date is required' };
      }

      if (!data.group_id || data.group_id.trim() === '') {
        return { data: null, error: 'Group ID is required' };
      }

      if (data.type === 'transfer') {
        if (!data.to_account_id || data.to_account_id.trim() === '') {
          return {
            data: null,
            error: 'Destination account is required for transfers',
          };
        }

        if (data.to_account_id === data.account_id) {
          return {
            data: null,
            error: 'Source and destination accounts must be different',
          };
        }
      }

      const createData: Prisma.transactionsCreateInput = {
        description: data.description.trim(),
        amount: data.amount,
        type: data.type,
        category: data.category,
        date: typeof data.date === 'string' ? new Date(data.date) : data.date,
        users: data.user_id ? { connect: { id: data.user_id } } : undefined,
        account_id: data.account_id,
        to_account_id: data.to_account_id || null,
        frequency: 'once',
        groups: { connect: { id: data.group_id } },
      };

      const transaction = await TransactionRepository.create(createData);

      if (!transaction) {
        return { data: null, error: 'Failed to create transaction' };
      }

      const tagsToInvalidate: string[] = [
        CACHE_TAGS.TRANSACTIONS,
        CACHE_TAGS.ACCOUNTS,
        `account:${data.account_id}:transactions`,
        `group:${data.group_id}:transactions`,
      ];
      if (data.user_id) {
        tagsToInvalidate.push(`user:${data.user_id}:transactions`);
        tagsToInvalidate.push(`user:${data.user_id}:budgets`);
      }
      if (data.to_account_id) {
        tagsToInvalidate.push(`account:${data.to_account_id}:transactions`);
      }
      tagsToInvalidate.push(`group:${data.group_id}:budgets`);

      for (const tag of tagsToInvalidate) {
        revalidateTag(tag, 'max');
      }

      return { data: serialize(transaction) as unknown as Transaction, error: null };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create transaction',
      };
    }
  }

  /**
   * Update an existing transaction
   */
  static async updateTransaction(
    id: string,
    data: UpdateTransactionInput
  ): Promise<ServiceResult<Transaction>> {
    try {
      if (!id || id.trim() === '') {
        return { data: null, error: 'Transaction ID is required' };
      }

      const existingTransaction = await TransactionRepository.getById(id);

      if (!existingTransaction) {
        return { data: null, error: 'Transaction not found' };
      }

      const existing = existingTransaction as unknown as Transaction;

      if (data.type === 'transfer' || existing.type === 'transfer') {
        const toAccountId = data.to_account_id ?? existing.to_account_id;
        const accountId = data.account_id ?? existing.account_id;

        if (data.type === 'transfer' && !toAccountId) {
          return {
            data: null,
            error: 'Destination account is required for transfers',
          };
        }

        if (toAccountId === accountId) {
          return {
            data: null,
            error: 'Source and destination accounts must be different',
          };
        }
      }

      const updateData: Prisma.transactionsUpdateInput = {
        updated_at: new Date(),
      };

      if (data.description !== undefined) updateData.description = data.description.trim();
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.date !== undefined) {
        updateData.date = typeof data.date === 'string' ? new Date(data.date) : data.date;
      }
      if (data.user_id !== undefined) updateData.users = data.user_id ? { connect: { id: data.user_id } } : { disconnect: true };
      if (data.account_id !== undefined) updateData.account_id = data.account_id;

      // Handle to_account_id update
      if (data.to_account_id !== undefined) {
        updateData.to_account_id = data.to_account_id;
      }

      if (data.group_id !== undefined) updateData.groups = { connect: { id: data.group_id } };

      const updatedTransaction = await TransactionRepository.update(id, updateData);

      if (!updatedTransaction) {
        return { data: null, error: 'Failed to update transaction' };
      }

      const tagsToInvalidate: string[] = [CACHE_TAGS.TRANSACTIONS, CACHE_TAGS.ACCOUNTS];

      if (existing.user_id) {
        tagsToInvalidate.push(`user:${existing.user_id}:transactions`);
        tagsToInvalidate.push(`user:${existing.user_id}:budgets`);
      }
      if (data.user_id && data.user_id !== existing.user_id) {
        tagsToInvalidate.push(`user:${data.user_id}:transactions`);
        tagsToInvalidate.push(`user:${data.user_id}:budgets`);
      }

      tagsToInvalidate.push(`account:${existing.account_id}:transactions`);
      if (existing.to_account_id) {
        tagsToInvalidate.push(`account:${existing.to_account_id}:transactions`);
      }

      if (data.account_id && data.account_id !== existing.account_id) {
        tagsToInvalidate.push(`account:${data.account_id}:transactions`);
      }
      if (data.to_account_id && data.to_account_id !== existing.to_account_id) {
        tagsToInvalidate.push(`account:${data.to_account_id}:transactions`);
      }

      if (existing.group_id) {
        tagsToInvalidate.push(`group:${existing.group_id}:transactions`);
        tagsToInvalidate.push(`group:${existing.group_id}:budgets`);
      }
      if (data.group_id && data.group_id !== existing.group_id) {
        tagsToInvalidate.push(`group:${data.group_id}:transactions`);
        tagsToInvalidate.push(`group:${data.group_id}:budgets`);
      }

      for (const tag of tagsToInvalidate) {
        revalidateTag(tag, 'max');
      }

      return { data: serialize(updatedTransaction) as unknown as Transaction, error: null };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update transaction',
      };
    }
  }

  /**
   * Delete a transaction
   */
  static async deleteTransaction(
    id: string
  ): Promise<ServiceResult<{ id: string }>> {
    try {
      if (!id || id.trim() === '') {
        return { data: null, error: 'Transaction ID is required' };
      }

      const existingTransaction = await TransactionRepository.getById(id);

      if (!existingTransaction) {
        return { data: null, error: 'Transaction not found' };
      }

      const existing = existingTransaction as unknown as Transaction;

      await TransactionRepository.delete(id);

      const tagsToInvalidate: string[] = [
        CACHE_TAGS.TRANSACTIONS,
        CACHE_TAGS.ACCOUNTS,
        `account:${existing.account_id}:transactions`,
      ];
      if (existing.user_id) {
        tagsToInvalidate.push(`user:${existing.user_id}:transactions`);
        tagsToInvalidate.push(`user:${existing.user_id}:budgets`);
      }
      if (existing.to_account_id) {
        tagsToInvalidate.push(`account:${existing.to_account_id}:transactions`);
      }
      if (existing.group_id) {
        tagsToInvalidate.push(`group:${existing.group_id}:transactions`);
        tagsToInvalidate.push(`group:${existing.group_id}:budgets`);
      }

      for (const tag of tagsToInvalidate) {
        revalidateTag(tag, 'max');
      }

      return { data: { id }, error: null };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete transaction',
      };
    }
  }

  /**
   * Calculate report metrics from transactions
   */
  static calculateReportMetrics(
    transactions: Transaction[],
    userId?: string
  ): ReportMetrics {
    const userIdFilter = userId || undefined;
    const breakdown = FinanceLogicService.calculateCategoryBreakdown(
      transactions.filter(t => !userIdFilter || t.user_id === userIdFilter)
    );

    const income = breakdown
      .filter((item: CategoryBreakdownItem) => item.received > 0)
      .reduce((sum: number, item: CategoryBreakdownItem) => sum + item.received, 0);

    const expenses = breakdown
      .filter((item: CategoryBreakdownItem) => item.spent > 0)
      .reduce((sum: number, item: CategoryBreakdownItem) => sum + item.spent, 0);

    const netSavings = income - expenses;
    const savingsRate = income > 0 ? (netSavings / income) * 100 : 0;

    return {
      income,
      expenses,
      netSavings,
      savingsRate,
      categories: breakdown.map((item: CategoryBreakdownItem) => ({
        name: item.category,
        amount: item.spent,
        percentage: item.percentage
      }))
    };
  }

  /**
   * Group transactions by date
   */
  static groupTransactionsByDate(
    transactions: Transaction[],
    locale: string = 'it-IT'
  ): Record<string, Transaction[]> {
    return transactions.reduce(
      (groups: Record<string, Transaction[]>, transaction) => {
        const txDate = toDateTime(transaction.date);
        if (!txDate) return groups;

        const dateLabel = formatDateSmart(txDate, locale);

        if (!groups[dateLabel]) {
          groups[dateLabel] = [];
        }

        groups[dateLabel].push(transaction);
        return groups;
      },
      {}
    );
  }

  /**
   * Calculate daily totals from grouped transactions
   */
  static calculateDailyTotals(
    groupedTransactions: Record<string, Transaction[]>
  ): Record<string, { income: number; expense: number }> {
    const totals: Record<string, { income: number; expense: number }> = {};

    Object.entries(groupedTransactions).forEach(([date, transactions]) => {
      totals[date] = transactions.reduce(
        (acc, t) => {
          if (t.type === 'income') {
            acc.income += t.amount;
          } else if (t.type === 'expense') {
            acc.expense += t.amount;
          }
          return acc;
        },
        { income: 0, expense: 0 }
      );
    });

    return totals;
  }
}
