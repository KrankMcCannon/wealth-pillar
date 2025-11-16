import { supabaseServer } from '@/lib/database/server';
import { cached, transactionCacheKeys, cacheOptions } from '@/lib/cache';
import type { ServiceResult } from './user.service';
import type { Transaction } from '@/lib/types';

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

    filteredTransactions.forEach((t) => {
      if (t.type === 'income') {
        income += t.amount;
      } else if (t.type === 'expense') {
        expenses += t.amount;
        // Build category breakdown for expenses
        const current = categoryMap.get(t.category) || 0;
        categoryMap.set(t.category, current + t.amount);
      }
    });

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return transactions.reduce(
      (groups: Record<string, Transaction[]>, transaction) => {
        const txDate = new Date(transaction.date);
        txDate.setHours(0, 0, 0, 0);

        let dateLabel: string;

        // Check if it's today
        if (txDate.getTime() === today.getTime()) {
          dateLabel = 'Oggi';
        }
        // Check if it's yesterday
        else if (txDate.getTime() === yesterday.getTime()) {
          dateLabel = 'Ieri';
        }
        // For other dates, use modern compact format with year
        else {
          const dayOfWeek = txDate.toLocaleDateString(locale, { weekday: 'short' });
          const day = txDate.getDate();
          const month = txDate.toLocaleDateString(locale, { month: 'short' });
          const year = txDate.getFullYear();

          // Capitalize first letter
          const capitalizedDayOfWeek = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
          const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);

          // Format: "Lun 15 Gen 2025" (modern, compact with year)
          dateLabel = `${capitalizedDayOfWeek} ${day} ${capitalizedMonth} ${year}`;
        }

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
      const txDate = new Date(t.date);
      return txDate.getFullYear() === year && txDate.getMonth() === month;
    });
  }

  /**
   * Get formatted month label
   * Returns localized month and year string
   *
   * @param year - Year
   * @param month - Month (0-11)
   * @param locale - Locale for formatting (default: 'it-IT')
   * @returns Formatted month label (e.g., "Gennaio 2025")
   *
   * @example
   * const label = TransactionService.getMonthLabel(2025, 0); // "Gennaio 2025"
   */
  static getMonthLabel(
    year: number,
    month: number,
    locale: string = 'it-IT'
  ): string {
    const date = new Date(year, month, 1);
    const monthName = date.toLocaleDateString(locale, { month: 'long' });
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
    const now = new Date();
    const currentYear = now.getFullYear();

    const ytdTransactions = allTransactions.filter((t) => {
      const txDate = new Date(t.date);
      return (
        txDate.getFullYear() === currentYear &&
        txDate.getMonth() <= currentMonth
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
    const now = new Date();
    const currentYear = now.getFullYear();

    // Single pass: filter, sum total, and build per-user breakdown
    let totalSavings = 0;
    const userBreakdown = new Map<string, number>();

    allTransactions.forEach((t) => {
      const txDate = new Date(t.date);

      // Check all conditions in one pass
      const isCurrentYear = txDate.getFullYear() === currentYear;
      const isUpToCurrentMonth = txDate.getMonth() <= currentMonth;
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
    });

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
}
