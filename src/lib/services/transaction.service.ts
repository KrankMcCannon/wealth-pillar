import { CACHE_TAGS, cached, cacheOptions, transactionCacheKeys } from '@/lib/cache';
import { supabaseServer } from '@/lib/database/server';
import type { Database } from '@/lib/database/types';
import type { Transaction, TransactionType } from '@/lib/types';
import {
  DateTime,
  formatDateSmart,
  today as luxonToday,
  nowISO,
  toDateTime,
} from '@/lib/utils/date-utils';
import type { ServiceResult } from './user.service';

/**
 * Helper to revalidate cache tags (dynamically imported to avoid client-side issues)
 */
async function revalidateCacheTags(tags: string[]) {
  if (globalThis.window === undefined) {
    const { revalidateTag } = await import('next/cache');
    for (const tag of tags) {
      revalidateTag(tag);
    }
  }
}

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
}

/**
 * Input data for updating an existing transaction
 */
export type UpdateTransactionInput = Partial<CreateTransactionInput>;

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
   * Create a new transaction
   * Used for adding new transactions to the database
   *
   * @param data - Transaction data to create
   * @returns Created transaction or error
   *
   * @example
   * const { data: transaction, error } = await TransactionService.createTransaction({
   *   description: 'Grocery shopping',
   *   amount: 50.00,
   *   type: 'expense',
   *   category: 'food',
   *   date: new Date(),
   *   user_id: userId,
   *   account_id: accountId,
   *   group_id: groupId
   * });
   */
  static async createTransaction(
    data: CreateTransactionInput
  ): Promise<ServiceResult<Transaction>> {
    try {
      // Input validation
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

      // Transfer-specific validation
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

      // Insert transaction
      const insertData: Database['public']['Tables']['transactions']['Insert'] = {
        description: data.description.trim(),
        amount: data.amount,
        type: data.type,
        category: data.category,
        date: typeof data.date === 'string' ? data.date : data.date.toISOString(),
        user_id: data.user_id,
        account_id: data.account_id,
        to_account_id: data.to_account_id || null,
        frequency: 'once', // Always 'once' for now (no recurring support)
        recurring_series_id: null,
        group_id: data.group_id,
      };

      const { data: transaction, error } = await supabaseServer
        .from('transactions')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!transaction) {
        return { data: null, error: 'Failed to create transaction' };
      }

      // Invalidate relevant caches
      const tagsToInvalidate: string[] = [
        CACHE_TAGS.TRANSACTIONS,
        `account:${data.account_id}:transactions`,
        `group:${data.group_id}:transactions`,
      ];
      if (data.user_id) {
        tagsToInvalidate.push(`user:${data.user_id}:transactions`);
      }
      if (data.to_account_id) {
        tagsToInvalidate.push(`account:${data.to_account_id}:transactions`);
      }
      await revalidateCacheTags(tagsToInvalidate);

      return { data: transaction, error: null };
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
   * Used for modifying transaction details
   *
   * @param id - Transaction ID
   * @param data - Updated transaction data
   * @returns Updated transaction or error
   *
   * @example
   * const { data: transaction, error } = await TransactionService.updateTransaction(
   *   transactionId,
   *   { description: 'Updated description', amount: 75.00 }
   * );
   */
  static async updateTransaction(
    id: string,
    data: UpdateTransactionInput
  ): Promise<ServiceResult<Transaction>> {
    try {
      // Input validation
      if (!id || id.trim() === '') {
        return { data: null, error: 'Transaction ID is required' };
      }

      // Validate updated fields if provided
      if (data.description !== undefined && data.description.trim() === '') {
        return { data: null, error: 'Description cannot be empty' };
      }

      if (data.amount !== undefined && data.amount <= 0) {
        return { data: null, error: 'Amount must be greater than zero' };
      }

      if (data.type !== undefined && !['income', 'expense', 'transfer'].includes(data.type)) {
        return { data: null, error: 'Invalid transaction type' };
      }

      if (data.category !== undefined && data.category.trim() === '') {
        return { data: null, error: 'Category cannot be empty' };
      }

      if (data.account_id !== undefined && data.account_id.trim() === '') {
        return { data: null, error: 'Account cannot be empty' };
      }

      // Check if transaction exists and get current data for cache invalidation
      const { data: existingTransaction, error: fetchError } =
        await supabaseServer
          .from('transactions')
          .select('*')
          .eq('id', id)
          .single();

      if (fetchError || !existingTransaction) {
        return { data: null, error: 'Transaction not found' };
      }

      // Cast to Transaction type for proper typing
      const existing = existingTransaction as Transaction;

      // Transfer-specific validation
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

      // Build update object with only provided fields
      const updateData: Database['public']['Tables']['transactions']['Update'] = {
        updated_at: nowISO(),
      };

      if (data.description !== undefined) updateData.description = data.description.trim();
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.date !== undefined) {
        updateData.date = typeof data.date === 'string' ? data.date : data.date.toISOString();
      }
      if (data.user_id !== undefined) updateData.user_id = data.user_id;
      if (data.account_id !== undefined) updateData.account_id = data.account_id;
      if (data.to_account_id !== undefined) updateData.to_account_id = data.to_account_id;
      if (data.group_id !== undefined) updateData.group_id = data.group_id;

      // Update transaction
      const { data: updatedTransaction, error } = await supabaseServer
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!updatedTransaction) {
        return { data: null, error: 'Failed to update transaction' };
      }

      // Invalidate relevant caches (both old and new values)
      const tagsToInvalidate: string[] = [CACHE_TAGS.TRANSACTIONS];

      // Invalidate old user cache
      if (existing.user_id) {
        tagsToInvalidate.push(`user:${existing.user_id}:transactions`);
      }
      // Invalidate new user cache if changed
      if (data.user_id && data.user_id !== existing.user_id) {
        tagsToInvalidate.push(`user:${data.user_id}:transactions`);
      }

      // Invalidate old account caches
      tagsToInvalidate.push(`account:${existing.account_id}:transactions`);
      if (existing.to_account_id) {
        tagsToInvalidate.push(`account:${existing.to_account_id}:transactions`);
      }

      // Invalidate new account caches if changed
      if (data.account_id && data.account_id !== existing.account_id) {
        tagsToInvalidate.push(`account:${data.account_id}:transactions`);
      }
      if (data.to_account_id && data.to_account_id !== existing.to_account_id) {
        tagsToInvalidate.push(`account:${data.to_account_id}:transactions`);
      }

      // Invalidate old group cache
      if (existing.group_id) {
        tagsToInvalidate.push(`group:${existing.group_id}:transactions`);
      }
      // Invalidate new group cache if changed
      if (data.group_id && data.group_id !== existing.group_id) {
        tagsToInvalidate.push(`group:${data.group_id}:transactions`);
      }

      await revalidateCacheTags(tagsToInvalidate);

      return { data: updatedTransaction, error: null };
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
   * Used for removing transactions from the database
   *
   * @param id - Transaction ID to delete
   * @returns Deleted transaction ID or error
   *
   * @example
   * const { data, error } = await TransactionService.deleteTransaction(transactionId);
   * if (!error) {
   *   console.log('Transaction deleted:', data.id);
   * }
   */
  static async deleteTransaction(
    id: string
  ): Promise<ServiceResult<{ id: string }>> {
    try {
      // Input validation
      if (!id || id.trim() === '') {
        return { data: null, error: 'Transaction ID is required' };
      }

      // Get transaction before deleting for cache invalidation
      const { data: existingTransaction, error: fetchError } =
        await supabaseServer
          .from('transactions')
          .select('*')
          .eq('id', id)
          .single();

      if (fetchError || !existingTransaction) {
        return { data: null, error: 'Transaction not found' };
      }

      // Cast to Transaction type for proper typing
      const existing = existingTransaction as Transaction;

      // Delete transaction
      const { error } = await supabaseServer
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      // Invalidate relevant caches
      const tagsToInvalidate: string[] = [
        CACHE_TAGS.TRANSACTIONS,
        `account:${existing.account_id}:transactions`,
      ];
      if (existing.user_id) {
        tagsToInvalidate.push(`user:${existing.user_id}:transactions`);
      }
      if (existing.to_account_id) {
        tagsToInvalidate.push(`account:${existing.to_account_id}:transactions`);
      }
      if (existing.group_id) {
        tagsToInvalidate.push(`group:${existing.group_id}:transactions`);
      }
      await revalidateCacheTags(tagsToInvalidate);

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
   * Used for generating financial reports and analytics
   * Note: Excludes transfer transactions (they don't affect income/expense metrics)
   *
   * @param transactions - Array of transactions to analyze
   * @param userId - Optional user ID to filter by specific user
   * @returns Report metrics including income, expenses, savings, and category breakdown
   *
   * @example
   * const { data: transactions } = await TransactionService.getTransactionsByGroup(groupId);
   * const metrics = TransactionService.calculateReportMetrics(transactions, userId);
   *
   * @complexity O(n) - Single pass for user filter, then O(n) for each calculation
   */
  static calculateReportMetrics(
    transactions: Transaction[],
    userId?: string
  ): ReportMetrics {
    // Filter by user if specified, excluding transactions without user_id
    // Also exclude transfer transactions (they don't affect income/expense)
    // Complexity: O(n)
    const filteredTransactions = userId
      ? transactions.filter(
        (t) => t.user_id === userId && t.type !== 'transfer'
      )
      : transactions.filter(
        (t) => t.user_id !== null && t.type !== 'transfer'
      );

    // Single pass to calculate income, expenses, and category breakdown
    // Complexity: O(n) - optimized to avoid multiple iterations
    let income = 0;
    let expenses = 0;
    const categoryMap = new Map<string, number>();

    for (const t of filteredTransactions) {
      if (t.type === 'income') {
        income += t.amount;
      } else if (t.type === 'expense') {
        expenses += t.amount;
        // Build category breakdown for expenses
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + t.amount);
      }
    }

    const netSavings = income - expenses;
    const savingsRate = income > 0 ? (netSavings / income) * 100 : 0;

    // Convert to array and sort by amount (descending)
    // Complexity: O(m log m) where m is number of unique categories (typically small)
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
        const txDate = toDateTime(transaction.date);
        if (!txDate) return groups;

        // Use formatDateSmart for consistent date labeling
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
   * Used for showing daily net income/expense
   * Note: Transfers are excluded from totals as they don't affect net worth
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
        // Exclude transfers from daily totals (they don't affect net worth)
        if (t.type === 'transfer') return sum;
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

  /**
   * Filter transactions by month and year
   * Used for monthly reports and analytics
   *
   * @param transactions - Array of transactions to filter
   * @param year - Year to filter by
   * @param month - Month to filter by (0-11, JavaScript Date format)
   * @returns Filtered transactions for the specified month
   *
   * @example
   * const monthlyTransactions = TransactionService.filterByMonth(transactions, 2025, 0); // January 2025
   */
  static filterByMonth(
    transactions: Transaction[],
    year: number,
    month: number
  ): Transaction[] {
    return transactions.filter((t) => {
      const txDate = toDateTime(t.date);
      if (!txDate) return false;
      return txDate.year === year && txDate.month === month;
    });
  }

  /**
   * Get formatted month label
   * Returns localized month and year string
   *
   * @param year - Year
   * @param month - Month (1-12 for Luxon)
   * @param locale - Locale for formatting (default: 'it-IT')
   * @returns Formatted month label (e.g., "Gennaio 2025")
   *
   * @example
   * const label = TransactionService.getMonthLabel(2025, 1); // "Gennaio 2025"
   */
  static getMonthLabel(
    year: number,
    month: number
  ): string {
    const dt = DateTime.local(year, month, 1);
    const monthName = dt.toFormat('LLLL'); // Full month name
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    return `${capitalizedMonth} ${year}`;
  }

  /**
   * Navigate to previous month
   * Returns new year and month values
   *
   * @param currentYear - Current year
   * @param currentMonth - Current month (0-11)
   * @returns Object with new year and month
   *
   * @example
   * const { year, month } = TransactionService.getPreviousMonth(2025, 0);
   * // Returns { year: 2024, month: 11 } (December 2024)
   */
  static getPreviousMonth(currentYear: number, currentMonth: number) {
    if (currentMonth === 0) {
      return { year: currentYear - 1, month: 11 };
    }
    return { year: currentYear, month: currentMonth - 1 };
  }

  /**
   * Navigate to next month
   * Returns new year and month values
   *
   * @param currentYear - Current year
   * @param currentMonth - Current month (0-11)
   * @returns Object with new year and month
   *
   * @example
   * const { year, month } = TransactionService.getNextMonth(2024, 11);
   * // Returns { year: 2025, month: 0 } (January 2025)
   */
  static getNextMonth(currentYear: number, currentMonth: number) {
    if (currentMonth === 11) {
      return { year: currentYear + 1, month: 0 };
    }
    return { year: currentYear, month: currentMonth + 1 };
  }

  /**
   * Calculate year-to-date metrics from monthly transactions
   * Used for annual savings goals and projections
   *
   * @param allTransactions - All transactions for the year
   * @param currentMonth - Current month (0-11)
   * @param userId - Optional user ID to filter by
   * @returns YTD metrics including monthly average and projections
   *
   * @example
   * const ytdMetrics = TransactionService.calculateYearToDateMetrics(transactions, 2, userId);
   */
  static calculateYearToDateMetrics(
    allTransactions: Transaction[],
    currentMonth: number,
    userId?: string
  ) {
    // Filter transactions for current year up to current month
    const today = luxonToday();
    const currentYear = today.year;

    const ytdTransactions = allTransactions.filter((t) => {
      const txDate = toDateTime(t.date);
      if (!txDate) return false;
      return (
        txDate.year === currentYear &&
        txDate.month <= currentMonth
      );
    });

    // Calculate YTD metrics
    const ytdMetrics = this.calculateReportMetrics(ytdTransactions, userId);

    // Calculate monthly average (divide by months elapsed + 1)
    const monthsElapsed = currentMonth + 1;
    const monthlyAvgIncome = ytdMetrics.income / monthsElapsed;
    const monthlyAvgExpenses = ytdMetrics.expenses / monthsElapsed;
    const monthlyAvgSavings = ytdMetrics.netSavings / monthsElapsed;

    // Project to year end (12 months total)
    const projectedYearEndIncome = monthlyAvgIncome * 12;
    const projectedYearEndExpenses = monthlyAvgExpenses * 12;
    const projectedYearEndSavings = monthlyAvgSavings * 12;

    return {
      ytd: ytdMetrics,
      monthlyAverage: {
        income: monthlyAvgIncome,
        expenses: monthlyAvgExpenses,
        savings: monthlyAvgSavings,
      },
      projected: {
        income: projectedYearEndIncome,
        expenses: projectedYearEndExpenses,
        savings: projectedYearEndSavings,
      },
    };
  }

  /**
   * Filter transactions by category and optionally by transaction type
   * Used for displaying transactions within a specific category
   *
   * @param transactions - Array of transactions to filter
   * @param categoryKey - Category key to filter by
   * @param transactionType - Optional transaction type filter (income, expense, transfer)
   * @returns Filtered transactions for the category and optionally type
   *
   * @example
   * const foodExpenses = TransactionService.filterByCategory(transactions, 'food', 'expense');
   * const allFoodTransactions = TransactionService.filterByCategory(transactions, 'food');
   *
   * @complexity O(n)
   */
  static filterByCategory(
    transactions: Transaction[],
    categoryKey: string,
    transactionType?: 'income' | 'expense' | 'transfer'
  ): Transaction[] {
    return transactions.filter((t) => {
      const matchesCategory = t.category === categoryKey;
      const matchesType = transactionType ? t.type === transactionType : true;
      return matchesCategory && matchesType;
    });
  }

  /**
   * Calculate balance from transactions of a specific category (Pure business logic)
   * Useful for calculating category-specific balances like "risparmi" (savings)
   *
   * Balance calculation:
   * - Income type: add amount
   * - Expense type: subtract amount
   * - Transfer type: ignored (doesn't affect category balance)
   *
   * @param transactions - All transactions
   * @param categoryKey - Category to calculate balance for
   * @returns Total balance for the category
   *
   * @example
   * const risparmiBalance = TransactionService.calculateCategoryBalance(transactions, 'risparmi');
   *
   * @complexity O(n)
   */
  static calculateCategoryBalance(
    transactions: Transaction[],
    categoryKey: string
  ): number {
    return transactions.reduce((balance, transaction) => {
      // Only process transactions matching the category
      if (transaction.category !== categoryKey) {
        return balance;
      }

      // Income adds to balance
      if (transaction.type === 'income') {
        return balance + transaction.amount;
      }
      // Expense subtracts from balance
      else if (transaction.type === 'expense') {
        return balance - transaction.amount;
      }

      // Transfers are ignored for category balance
      return balance;
    }, 0);
  }

  /**
   * Calculate savings goal metrics from "risparmi" category transactions
   * Used specifically for savings goal tracking (considers all transaction types with "risparmi" category)
   * Note: Adds all amounts directly without conditional logic based on type
   * Always calculates total for all users, with per-user breakdown
   *
   * @param allTransactions - All transactions for the year
   * @param currentMonth - Current month (0-11)
   * @returns Savings goal metrics with YTD total, monthly average, projections, and per-user breakdown
   *
   * @example
   * const savingsGoal = TransactionService.calculateSavingsGoalMetrics(transactions, 2);
   *
   * @complexity O(n) - Single pass filter and reduce
   */
  static calculateSavingsGoalMetrics(
    allTransactions: Transaction[],
    currentMonth: number
  ) {
    // Filter and calculate in optimized single pass
    // Complexity: O(n)
    const today = luxonToday();
    const currentYear = today.year;

    // Single pass: filter, sum total, and build per-user breakdown
    let totalSavings = 0;
    const userBreakdown = new Map<string, number>();

    for (const t of allTransactions) {
      const txDate = toDateTime(t.date);
      if (!txDate) continue;

      // Check all conditions in one pass
      const isCurrentYear = txDate.year === currentYear;
      const isUpToCurrentMonth = txDate.month <= currentMonth;
      const isSavingsCategory = t.category === 'risparmi';

      // Count all transaction types with "risparmi" category
      // Add amounts directly without conditional logic based on type
      if (isCurrentYear && isUpToCurrentMonth && isSavingsCategory) {
        totalSavings += t.amount;

        // Track per-user contribution
        if (t.user_id) {
          const userTotal = userBreakdown.get(t.user_id) || 0;
          userBreakdown.set(t.user_id, userTotal + t.amount);
        }
      }
    }

    // Calculate monthly average (divide by months elapsed + 1)
    const monthsElapsed = currentMonth + 1;
    const monthlyAvgSavings = totalSavings / monthsElapsed;

    // Project to year end (12 months total)
    const projectedYearEndSavings = monthlyAvgSavings * 12;

    // Convert user breakdown to array
    const userContributions = Array.from(userBreakdown.entries()).map(
      ([userId, amount]) => ({
        userId,
        amount,
        percentage: totalSavings > 0 ? (amount / totalSavings) * 100 : 0,
      })
    );

    return {
      total: totalSavings,
      monthlyAverage: monthlyAvgSavings,
      projected: projectedYearEndSavings,
      userContributions,
    };
  }

  /**
   * Calculate total earned amount from transactions
   * Includes: income transactions + transfers TO user's accounts
   *
   * @param transactions - All transactions to analyze
   * @param userAccountIds - Array of account IDs belonging to the user
   * @param userId - Optional user ID to filter transactions (omit for "all members")
   * @returns Total earned amount
   *
   * @example
   * const earned = TransactionService.calculateEarned(transactions, ['acc1', 'acc2'], 'user123');
   *
   * @complexity O(n) - Single pass through transactions
   */
  static calculateEarned(
    transactions: Transaction[],
    userAccountIds: string[],
    userId?: string
  ): number {
    return transactions.reduce((sum, t) => {
      // Filter by user if specified (skip if "all members")
      if (userId && t.user_id !== userId) {
        return sum;
      }

      // Income transactions where account belongs to user
      if (t.type === 'income' && userAccountIds.includes(t.account_id)) {
        return sum + t.amount;
      }

      // Incoming transfers (to_account_id matches user's accounts)
      if (
        t.type === 'transfer' &&
        t.to_account_id &&
        userAccountIds.includes(t.to_account_id)
      ) {
        return sum + t.amount;
      }

      return sum;
    }, 0);
  }

  /**
   * Calculate total spent amount from transactions
   * Includes: expense transactions + transfers FROM user's accounts
   *
   * @param transactions - All transactions to analyze
   * @param userAccountIds - Array of account IDs belonging to the user
   * @param userId - Optional user ID to filter transactions (omit for "all members")
   * @returns Total spent amount
   *
   * @example
   * const spent = TransactionService.calculateSpent(transactions, ['acc1', 'acc2'], 'user123');
   *
   * @complexity O(n) - Single pass through transactions
   */
  static calculateSpent(
    transactions: Transaction[],
    userAccountIds: string[],
    userId?: string
  ): number {
    return transactions.reduce((sum, t) => {
      // Filter by user if specified (skip if "all members")
      if (userId && t.user_id !== userId) {
        return sum;
      }

      // Expense transactions where account belongs to user
      if (t.type === 'expense' && userAccountIds.includes(t.account_id)) {
        return sum + t.amount;
      }

      // Outgoing transfers (account_id matches user's accounts)
      if (
        t.type === 'transfer' &&
        userAccountIds.includes(t.account_id)
      ) {
        return sum + t.amount;
      }

      return sum;
    }, 0);
  }

  /**
   * Filter transactions within a budget period date range
   *
   * @param transactions - All transactions to filter
   * @param period - Budget period with start_date and end_date
   * @returns Filtered transactions within the period
   *
   * @example
   * const periodTxns = TransactionService.filterByBudgetPeriod(transactions, budgetPeriod);
   *
   * @complexity O(n) - Single pass filter
   */
  static filterByBudgetPeriod(
    transactions: Transaction[],
    period: { start_date: string | Date; end_date: string | Date | null }
  ): Transaction[] {
    const periodStart = toDateTime(period.start_date);
    if (!periodStart) return [];
    const normalizedStart = periodStart.startOf('day');

    const periodEnd = period.end_date ? toDateTime(period.end_date) : luxonToday();
    if (!periodEnd) return [];
    const normalizedEnd = periodEnd.endOf('day');

    return transactions.filter((t) => {
      const txDate = toDateTime(t.date);
      if (!txDate) return false;
      return txDate >= normalizedStart && txDate <= normalizedEnd;
    });
  }
}
