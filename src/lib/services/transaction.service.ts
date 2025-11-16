import { supabaseServer } from '@/lib/database/server';
import { cached, transactionCacheKeys, cacheOptions } from '@/lib/cache';
import type { Database } from '@/lib/database/types';
import type { ServiceResult } from './user.service';
import type { Transaction as LocalTransaction } from '@/lib/types';

/**
 * Database Transaction type (used internally for queries)
 */
type DbTransaction = Database['public']['Tables']['transactions']['Row'];

/**
 * Transaction type (exported for use in components - supports both string and Date)
 */
type Transaction = LocalTransaction;

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
 * Transaction Service
 * Handles all transaction-related business logic following Single Responsibility Principle
 *
 * All methods return ServiceResult for consistent error handling
 * All database queries are cached using Next.js unstable_cache
 */
export class TransactionService {
  /**
   * Retrieves all transactions for a specific group
   * Used for displaying group-wide transaction history
   *
   * @param groupId - Group ID
   * @returns Array of transactions or error
   *
   * @example
   * const { data: transactions, error } = await TransactionService.getTransactionsByGroup(groupId);
   * if (error) {
   *   console.error('Failed to get transactions:', error);
   * }
   */
  static async getTransactionsByGroup(
    groupId: string
  ): Promise<ServiceResult<Transaction[]>> {
    try {
      // Input validation
      if (!groupId || groupId.trim() === '') {
        return {
          data: null,
          error: 'Group ID is required',
        };
      }

      // Create cached query function
      const getCachedTransactions = cached(
        async () => {
          const { data, error } = await supabaseServer
            .from('transactions')
            .select('*')
            .eq('group_id', groupId)
            .order('date', { ascending: false });

          if (error) {
            throw new Error(error.message);
          }

          return data;
        },
        transactionCacheKeys.byGroup(groupId),
        cacheOptions.transactionsByGroup(groupId)
      );

      const transactions = await getCachedTransactions();

      return {
        data: transactions || [],
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
   * Used for displaying personal transaction history
   *
   * @param userId - User ID
   * @returns Array of transactions or error
   *
   * @example
   * const { data: transactions, error } = await TransactionService.getTransactionsByUser(userId);
   * if (error) {
   *   console.error('Failed to get transactions:', error);
   * }
   */
  static async getTransactionsByUser(
    userId: string
  ): Promise<ServiceResult<Transaction[]>> {
    try {
      // Input validation
      if (!userId || userId.trim() === '') {
        return {
          data: null,
          error: 'User ID is required',
        };
      }

      // Create cached query function
      const getCachedTransactions = cached(
        async () => {
          const { data, error } = await supabaseServer
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

          if (error) {
            throw new Error(error.message);
          }

          return data;
        },
        transactionCacheKeys.byUser(userId),
        cacheOptions.transactionsByUser(userId)
      );

      const transactions = await getCachedTransactions();

      return {
        data: transactions || [],
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
   * Includes both transactions where the account is the source (account_id)
   * and where it's the destination (to_account_id) for transfers
   *
   * @param accountId - Account ID
   * @returns Array of transactions or error
   *
   * @example
   * const { data: transactions, error } = await TransactionService.getTransactionsByAccount(accountId);
   * if (error) {
   *   console.error('Failed to get transactions:', error);
   * }
   */
  static async getTransactionsByAccount(
    accountId: string
  ): Promise<ServiceResult<Transaction[]>> {
    try {
      // Input validation
      if (!accountId || accountId.trim() === '') {
        return {
          data: null,
          error: 'Account ID is required',
        };
      }

      // Create cached query function
      const getCachedTransactions = cached(
        async () => {
          const { data, error } = await supabaseServer
            .from('transactions')
            .select('*')
            .or(`account_id.eq.${accountId},to_account_id.eq.${accountId}`)
            .order('date', { ascending: false });

          if (error) {
            throw new Error(error.message);
          }

          return data;
        },
        transactionCacheKeys.byAccount(accountId),
        cacheOptions.transactionsByAccount(accountId)
      );

      const transactions = await getCachedTransactions();

      return {
        data: transactions || [],
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
   * Calculate report metrics from transactions
   * Used for generating financial reports and analytics
   *
   * @param transactions - Array of transactions to analyze
   * @param userId - Optional user ID to filter by specific user
   * @returns Report metrics including income, expenses, savings, and category breakdown
   *
   * @example
   * const { data: transactions } = await TransactionService.getTransactionsByGroup(groupId);
   * const metrics = TransactionService.calculateReportMetrics(transactions, userId);
   */
  static calculateReportMetrics(
    transactions: Transaction[],
    userId?: string
  ): ReportMetrics {
    // Filter by user if specified, excluding transactions without user_id
    const filteredTransactions = userId
      ? transactions.filter((t) => t.user_id === userId)
      : transactions.filter((t) => t.user_id !== null);

    // Calculate income and expenses
    const income = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netSavings = income - expenses;
    const savingsRate = income > 0 ? (netSavings / income) * 100 : 0;

    // Calculate category breakdown
    const categoryMap = new Map<string, number>();
    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + t.amount);
      });

    // Convert to array and sort by amount (descending)
    const categories: CategoryMetric[] = Array.from(categoryMap.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: expenses > 0 ? (amount / expenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      income,
      expenses,
      netSavings,
      savingsRate,
      categories,
    };
  }

  /**
   * Group transactions by date
   * Used for displaying transactions organized by day
   *
   * @param transactions - Array of transactions to group
   * @param locale - Locale for date formatting (default: 'it-IT')
   * @returns Object with dates as keys and transaction arrays as values
   *
   * @example
   * const { data: transactions } = await TransactionService.getTransactionsByUser(userId);
   * const grouped = TransactionService.groupTransactionsByDate(transactions);
   */
  static groupTransactionsByDate(
    transactions: Transaction[],
    locale: string = 'it-IT'
  ): Record<string, Transaction[]> {
    return transactions.reduce(
      (groups: Record<string, Transaction[]>, transaction) => {
        const date = new Date(transaction.date).toLocaleDateString(locale, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        if (!groups[date]) {
          groups[date] = [];
        }

        groups[date].push(transaction);
        return groups;
      },
      {}
    );
  }

  /**
   * Calculate daily totals from grouped transactions
   * Used for showing daily net income/expense
   *
   * @param groupedTransactions - Transactions grouped by date
   * @returns Array of daily summaries with date, total, count, and transactions
   *
   * @example
   * const grouped = TransactionService.groupTransactionsByDate(transactions);
   * const dailyTotals = TransactionService.calculateDailyTotals(grouped);
   */
  static calculateDailyTotals(groupedTransactions: Record<string, Transaction[]>) {
    return Object.entries(groupedTransactions).map(([date, dayTransactions]) => {
      const total = dayTransactions.reduce((sum, t) => {
        if (t.type === 'income') return sum + t.amount;
        if (t.type === 'expense') return sum - t.amount;
        return sum;
      }, 0);

      return {
        date,
        total,
        count: dayTransactions.length,
        transactions: dayTransactions,
      };
    });
  }
}
