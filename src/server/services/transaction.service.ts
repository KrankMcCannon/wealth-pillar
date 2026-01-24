import 'server-only';
import { cached } from '@/lib/cache';
import { CACHE_TAGS, cacheOptions } from '@/lib/cache/config';
import { transactionCacheKeys } from '@/lib/cache/keys';
export { TransactionLogic } from './transaction.logic';
import { TransactionRepository, AccountRepository } from '@/server/dal';
import type { CategoryBreakdownItem, Transaction, TransactionType } from '@/lib/types';
import {
  formatDateSmart,
  toDateTime,
} from '@/lib/utils/date-utils';
import { FinanceLogicService } from './finance-logic.service';
import { revalidateTag } from 'next/cache';
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
 * Transaction Service
 * Handles all transaction-related business logic following Single Responsibility Principle
 *
 * All methods throw standard errors instead of returning ServiceResult objects
 * All database queries are cached using Next.js unstable_cache
 */
export class TransactionService {
  /**
   * Get category spending breakdown for a group in a time range
   */
  static async getGroupCategorySpending(groupId: string, startDate: Date, endDate: Date) {
    return TransactionRepository.getGroupCategorySpending(groupId, startDate, endDate);
  }

  /**
   * Get monthly spending trend for a group in a time range
   */
  static async getGroupMonthlySpending(groupId: string, startDate: Date, endDate: Date) {
    return TransactionRepository.getGroupMonthlySpending(groupId, startDate, endDate);
  }

  /**
   * Get category spending breakdown per user for a group in a time range
   */
  static async getGroupUserCategorySpending(groupId: string, startDate: Date, endDate: Date) {
    return TransactionRepository.getGroupUserCategorySpending(groupId, startDate, endDate);
  }

  /**
   * Helper to update account balances based on transaction
   * @param transaction The transaction object
   * @param direction 1 for applying (create), -1 for reverting (delete)
   */
  private static async updateBalancesForTransaction(
    transaction: Transaction,
    direction: 1 | -1
  ) {
    const { amount, type, account_id, to_account_id } = transaction;

    if (type === 'income') {
      // Income increases balance
      await AccountRepository.updateBalance(account_id, amount * direction);
    } else if (type === 'expense') {
      // Expense decreases balance
      await AccountRepository.updateBalance(account_id, -amount * direction);
    } else if (type === 'transfer' && to_account_id) {
      // Transfer: decreases source, increases destination
      await Promise.all([
        AccountRepository.updateBalance(account_id, -amount * direction),
        AccountRepository.updateBalance(to_account_id, amount * direction)
      ]);
    }
  }

  /**
   * Retrieves transactions for a specific group with pagination
   * @param groupId - Group ID
   * @param options - Pagination options (limit, offset)
   * @returns Paginated transactions with metadata
   */
  static async getTransactionsByGroupPaginated(
    groupId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ data: Transaction[]; total: number; hasMore: boolean }> {
    if (!groupId || groupId.trim() === '') {
      throw new Error('Group ID is required');
    }

    const result = await TransactionRepository.getByGroup(groupId, options);
    return {
      data: serialize(result.data || []) as unknown as Transaction[],
      total: result.total,
      hasMore: result.hasMore
    };
  }

  /**
   * Retrieves all transactions for a specific group (for calculations)
   * WARNING: Use sparingly - fetches all data. Prefer paginated version for UI.
   */
  static async getTransactionsByGroup(groupId: string): Promise<Transaction[]> {
    if (!groupId || groupId.trim() === '') {
      throw new Error('Group ID is required');
    }

    const getCachedTransactions = cached(
      async () => {
        // Fetch all for calculations (high limit)
        const result = await TransactionRepository.getByGroup(groupId, { limit: 10000 });
        return serialize(result.data || []) as unknown as Transaction[];
      },
      transactionCacheKeys.byGroup(groupId),
      cacheOptions.transactionsByGroup(groupId)
    );

    const transactions = await getCachedTransactions();

    return transactions;
  }

  /**
   * Retrieves all transactions for a specific user
   */
  static async getTransactionsByUser(userId: string): Promise<Transaction[]> {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
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

    return transactions;
  }

  /**
   * Retrieves transaction count for a specific user
   * Optimized to avoiding fetching full dataset
   */
  static async getTransactionCountByUser(userId: string): Promise<number> {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    const getCachedCount = cached(
      async () => {
        // Use limit: 0 to only fetch count
        const result = await TransactionRepository.getByUser(userId, { limit: 0 });
        return result.total;
      },
      [`user:${userId}:transactions:count`],
      {
        revalidate: 300, // 5 minutes cache for counts
        tags: [CACHE_TAGS.TRANSACTIONS, `user:${userId}:transactions`],
      }
    );

    return getCachedCount();
  }

  /**
   * Retrieves all transactions for a specific account
   */
  static async getTransactionsByAccount(accountId: string): Promise<Transaction[]> {
    if (!accountId || accountId.trim() === '') {
      throw new Error('Account ID is required');
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

    return transactions;
  }

  /**
   * Get a single transaction by ID
   */
  static async getTransactionById(transactionId: string): Promise<Transaction> {
    if (!transactionId || transactionId.trim() === '') {
      throw new Error('Transaction ID is required');
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

    return transaction;
  }

  /**
   * Create a new transaction
   */
  static async createTransaction(data: CreateTransactionInput): Promise<Transaction> {
    if (!data.description || data.description.trim() === '') {
      throw new Error('Description is required');
    }

    if (!data.amount || data.amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    if (!data.type) {
      throw new Error('Transaction type is required');
    }

    if (!['income', 'expense', 'transfer'].includes(data.type)) {
      throw new Error('Invalid transaction type');
    }

    if (!data.category || data.category.trim() === '') {
      throw new Error('Category is required');
    }

    if (!data.account_id || data.account_id.trim() === '') {
      throw new Error('Account is required');
    }

    if (!data.date) {
      throw new Error('Date is required');
    }

    if (!data.group_id || data.group_id.trim() === '') {
      throw new Error('Group ID is required');
    }

    if (data.type === 'transfer') {
      if (!data.to_account_id || data.to_account_id.trim() === '') {
        throw new Error('Destination account is required for transfers');
      }

      if (data.to_account_id === data.account_id) {
        throw new Error('Source and destination accounts must be different');
      }
    }

    const createData = {
      description: data.description.trim(),
      amount: data.amount,
      type: data.type,
      category: data.category,
      date: typeof data.date === 'string' ? new Date(data.date).toISOString() : data.date.toISOString(),
      user_id: data.user_id || null,
      account_id: data.account_id,
      to_account_id: data.to_account_id || null,
      frequency: 'once',
      group_id: data.group_id,
    };

    const transaction = await TransactionRepository.create(createData);

    if (!transaction) {
      throw new Error('Failed to create transaction');
    }

    // Update account balance
    await this.updateBalancesForTransaction(transaction as unknown as Transaction, 1);

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

    return serialize(transaction) as unknown as Transaction;
  }

  /**
   * Update an existing transaction
   */
  static async updateTransaction(
    id: string,
    data: UpdateTransactionInput
  ): Promise<Transaction> {
    if (!id || id.trim() === '') {
      throw new Error('Transaction ID is required');
    }

    const existingTransaction = await TransactionRepository.getById(id);

    if (!existingTransaction) {
      throw new Error('Transaction not found');
    }

    const existing = existingTransaction as unknown as Transaction;

    if (data.type === 'transfer' || existing.type === 'transfer') {
      const toAccountId = data.to_account_id ?? existing.to_account_id;
      const accountId = data.account_id ?? existing.account_id;

      if (data.type === 'transfer' && !toAccountId) {
        throw new Error('Destination account is required for transfers');
      }

      if (toAccountId === accountId) {
        throw new Error('Source and destination accounts must be different');
      }
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.date !== undefined) {
      updateData.date = typeof data.date === 'string' ? new Date(data.date).toISOString() : data.date.toISOString();
    }
    if (data.user_id !== undefined) updateData.user_id = data.user_id;
    if (data.account_id !== undefined) updateData.account_id = data.account_id;

    // Handle to_account_id update
    if (data.to_account_id !== undefined) {
      updateData.to_account_id = data.to_account_id;
    }

    if (data.group_id !== undefined) updateData.group_id = data.group_id;

    const updatedTransaction = await TransactionRepository.update(id, updateData);

    if (!updatedTransaction) {
      throw new Error('Failed to update transaction');
    }

    // Update account balances: Revert old, Apply new
    await this.updateBalancesForTransaction(existing, -1);
    await this.updateBalancesForTransaction(updatedTransaction as unknown as Transaction, 1);

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

    return serialize(updatedTransaction) as unknown as Transaction;
  }

  /**
   * Delete a transaction
   */
  static async deleteTransaction(id: string): Promise<{ id: string }> {
    if (!id || id.trim() === '') {
      throw new Error('Transaction ID is required');
    }

    const existingTransaction = await TransactionRepository.getById(id);

    if (!existingTransaction) {
      throw new Error('Transaction not found');
    }

    const existing = existingTransaction as unknown as Transaction;

    await TransactionRepository.delete(id);

    // Update account balance (revert transaction)
    await this.updateBalancesForTransaction(existing, -1);

    const tagsToInvalidate: string[] = [
      CACHE_TAGS.TRANSACTIONS,
      CACHE_TAGS.ACCOUNTS,
      `account:${existing.account_id}:transactions`,
      `group:${existing.group_id}:transactions`,
    ];
    if (existing.user_id) {
      tagsToInvalidate.push(`user:${existing.user_id}:transactions`);
      tagsToInvalidate.push(`user:${existing.user_id}:budgets`);
    }
    if (existing.to_account_id) {
      tagsToInvalidate.push(`account:${existing.to_account_id}:transactions`);
    }
    tagsToInvalidate.push(`group:${existing.group_id}:budgets`);

    for (const tag of tagsToInvalidate) {
      revalidateTag(tag, 'max');
    }

    return { id };
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
