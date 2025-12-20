/**
 * Report Period Service
 * Business logic for calculating earned/spent metrics from transactions
 * based on budget periods
 */

import type { Account, BudgetPeriod, Transaction, User } from '@/lib/types';
import { now, toDateTime } from '@/lib/utils/date-utils';

/**
 * Category breakdown item for transaction analysis with NET calculations
 */
export interface CategoryBreakdownItem {
  category: string;      // Category key
  spent: number;         // Total expenses in this category
  received: number;      // Total income in this category
  net: number;           // Net position (spent - received, positive = net spending, negative = net income)
  percentage: number;    // Percentage of total NET spending (for positive NETs only)
  count: number;         // Number of transactions
}

/**
 * Enhanced budget period with calculated metrics including NET analysis
 */
export interface EnrichedBudgetPeriod extends BudgetPeriod {
  userName: string;
  totalEarned: number;           // Legacy: Total income + incoming transfers
  totalSpent: number;            // Legacy: Total expenses + outgoing transfers
  totalGain: number;             // Legacy: totalEarned - totalSpent
  totalRealSpent: number;        // NEW: Sum of positive category NETs (real spending)
  totalRealReceived: number;     // NEW: Sum of negative category NETs (real income)
  totalRealGain: number;         // NEW: Real balance (totalRealReceived - totalRealSpent)
  internalTransfers: number;     // NEW: Total amount moved between own accounts
  categoryBreakdown: CategoryBreakdownItem[]; // Sorted by absolute NET descending
  transactions: Transaction[];   // Sorted by amount descending
}

/**
 * Report Period Service
 * Handles budget period calculations and enrichment following SOLID principles
 *
 * All methods return calculated values for consistent data processing
 */
export class ReportPeriodService {
  /**
   * Calculate total earned amount from transactions
   * Includes: income transactions only (transfers excluded)
   *
   * @param transactions - All transactions to analyze
   * @param userAccountIds - Array of account IDs belonging to the user
   * @param userId - Optional user ID to filter transactions (omit for "all members")
   * @returns Total earned amount
   *
   * @example
   * const earned = ReportPeriodService.calculateEarned(transactions, ['acc1', 'acc2'], 'user123');
   *
   * @complexity O(n) - Single pass through transactions
   */
  static calculateEarned(
    transactions: Transaction[],
    userAccountIds: string[],
  ): number {
    return transactions.reduce((sum, t) => {
      // Income transactions where account belongs to user
      if (t.type === 'income' && userAccountIds.includes(t.account_id)) {
        return sum + t.amount;
      }

      return sum;
    }, 0);
  }

  /**
   * Calculate total spent amount from transactions
   * Includes: expense transactions only (transfers excluded)
   *
   * @param transactions - All transactions to analyze
   * @param userAccountIds - Array of account IDs belonging to the user
   * @param userId - Optional user ID to filter transactions (omit for "all members")
   * @returns Total spent amount
   *
   * @example
   * const spent = ReportPeriodService.calculateSpent(transactions, ['acc1', 'acc2'], 'user123');
   *
   * @complexity O(n) - Single pass through transactions
   */
  static calculateSpent(
    transactions: Transaction[],
    userAccountIds: string[],
  ): number {
    return transactions.reduce((sum, t) => {
      // Expense transactions where account belongs to user
      if (t.type === 'expense' && userAccountIds.includes(t.account_id)) {
        return sum + t.amount;
      }

      return sum;
    }, 0);
  }

  /**
   * Filter transactions within a budget period date range
   * Uses UTC dates to avoid timezone conversion issues
   *
   * @param transactions - All transactions to filter
   * @param startDate - Period start date
   * @param endDate - Period end date (null means ongoing period, uses current date)
   * @returns Filtered transactions within the period
   *
   * @example
   * const periodTxns = ReportPeriodService.filterTransactionsByPeriod(
   *   transactions,
   *   '2025-01-15',
   *   '2025-02-14'
   * );
   *
   * @complexity O(n) - Single pass filter
   */
  static filterTransactionsByPeriod(
    transactions: Transaction[],
    startDate: string | Date,
    endDate: string | Date | null
  ): Transaction[] {
    const periodStart = toDateTime(startDate);
    if (!periodStart) return [];
    // Start of day
    const normalizedStart = periodStart.startOf('day');

    const periodEnd = endDate ? toDateTime(endDate) : now();
    if (!periodEnd) return [];
    // End of day
    const normalizedEnd = periodEnd.endOf('day');

    return transactions.filter((t) => {
      const txDate = toDateTime(t.date);
      if (!txDate) return false;
      return txDate >= normalizedStart && txDate <= normalizedEnd;
    });
  }

  /**
   * Calculate internal transfers (transfers between user's own accounts)
   * These should be excluded from spending/income calculations as they don't represent real cash flow
   *
   * @param transactions - Filtered transactions for the period and user
   * @param userAccountIds - Array of account IDs belonging to the user
   * @returns Total amount of internal transfers
   *
   * @example
   * const internal = ReportPeriodService.calculateInternalTransfers(userTransactions, userAccountIds);
   *
   * @complexity O(n) - Single pass through transactions
   */
  static calculateInternalTransfers(
    transactions: Transaction[],
    userAccountIds: string[]
  ): number {
    return transactions
      .filter(t =>
        t.type === 'transfer' &&
        t.to_account_id &&
        userAccountIds.includes(t.account_id) &&
        userAccountIds.includes(t.to_account_id)
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }

  /**
   * Calculate category breakdown from transactions with NET analysis
   * Returns categories sorted by absolute NET (descending)
   * Includes only income and expense transactions (transfers excluded)
   *
   * @param transactions - Filtered transactions for the period and user
   * @returns Array of category breakdowns sorted by amount descending
   *
   * @example
   * const breakdown = ReportPeriodService.calculateCategoryBreakdown(userTransactions);
   *
   * @complexity O(n + m log m) where n is transactions, m is unique categories
   */
  static calculateCategoryBreakdown(
    transactions: Transaction[]
  ): CategoryBreakdownItem[] {
    if (transactions.length === 0) return [];

    // Group by category and calculate spent/received separately
    const categoryMap = new Map<string, { spent: number; received: number; count: number }>();

    for (const t of transactions) {
      // Skip transfer transactions completely
      if (t.type === 'transfer') continue;

      const existing = categoryMap.get(t.category) || { spent: 0, received: 0, count: 0 };

      if (t.type === 'expense') {
        // Expense transactions: always count as spent
        existing.spent += t.amount;
        existing.count += 1;
      } else if (t.type === 'income') {
        // Income transactions: always count as received
        existing.received += t.amount;
        existing.count += 1;
      }

      categoryMap.set(t.category, existing);
    }

    // Convert to array and calculate NET for each category
    const breakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      spent: data.spent,
      received: data.received,
      net: data.spent - data.received, // Positive = net spending, Negative = net income
      percentage: 0, // Will be calculated below
      count: data.count
    }));

    // Calculate total NET spending (sum of positive NETs only) for percentage calculation
    const totalNetSpending = breakdown
      .filter(item => item.net > 0)
      .reduce((sum, item) => sum + item.net, 0);

    // Calculate percentage for each category (only for net spending categories)
    for (const item of breakdown) {
      if (item.net > 0 && totalNetSpending > 0) {
        item.percentage = (item.net / totalNetSpending) * 100;
      } else {
        item.percentage = 0;
      }
    }

    // Sort by absolute NET value descending (show biggest impacts first)
    return breakdown.sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }

  /**
   * Enrich budget periods with calculated metrics
   * Combines period data with transaction analysis
   *
   * @param budgetPeriods - Array of budget periods to enrich
   * @param users - All users in the group
   * @param transactions - All transactions
   * @param accounts - All accounts
   * @returns Enriched budget periods with metrics and chart data
   *
   * @example
   * const enriched = ReportPeriodService.enrichBudgetPeriods(
   *   periods,
   *   groupUsers,
   *   transactions,
   *   accounts
   * );
   *
   * @complexity O(n*m) where n is periods and m is transactions
   */
  static enrichBudgetPeriods(
    budgetPeriods: BudgetPeriod[],
    users: User[],
    transactions: Transaction[],
    accounts: Account[]
  ): EnrichedBudgetPeriod[] {
    return budgetPeriods.map((period) => {
      // Find user who owns this period
      const user = users.find((u) => u.id === period.user_id);
      const userName = user?.name || 'Unknown User';

      // Filter transactions for this period by date range
      const periodTransactions = this.filterTransactionsByPeriod(
        transactions,
        period.start_date,
        period.end_date
      );

      // Filter by user_id (exclude transactions with null user_id)
      const userTransactions = periodTransactions.filter(
        t => t.user_id === period.user_id
      );

      // Get account IDs for earned/spent calculations (still needed for transfers)
      const userAccountIds = accounts
        .filter((a) => a.user_ids.includes(period.user_id))
        .map((a) => a.id);

      // Calculate legacy earned/spent for this user's period (for backward compatibility)
      const totalEarned = this.calculateEarned(
        userTransactions,
        userAccountIds,
      );
      const totalSpent = this.calculateSpent(
        userTransactions,
        userAccountIds,
      );
      const totalGain = totalEarned - totalSpent;

      // Calculate internal transfers (to exclude from real spending)
      const internalTransfers = this.calculateInternalTransfers(
        userTransactions,
        userAccountIds
      );

      // Calculate category breakdown with NET analysis
      const categoryBreakdown = this.calculateCategoryBreakdown(userTransactions);

      // Calculate real spending totals from category breakdown
      const totalRealSpent = categoryBreakdown
        .filter(item => item.net > 0)
        .reduce((sum, item) => sum + item.net, 0);

      const totalRealReceived = Math.abs(
        categoryBreakdown
          .filter(item => item.net < 0)
          .reduce((sum, item) => sum + item.net, 0)
      );

      const totalRealGain = totalRealReceived - totalRealSpent;

      // Sort transactions by amount descending
      const sortedTransactions = [...userTransactions].sort((a, b) => b.amount - a.amount);

      return {
        ...period,
        userName,
        totalEarned,
        totalSpent,
        totalGain,
        totalRealSpent,
        totalRealReceived,
        totalRealGain,
        internalTransfers,
        categoryBreakdown,
        transactions: sortedTransactions,
      };
    });
  }
}
