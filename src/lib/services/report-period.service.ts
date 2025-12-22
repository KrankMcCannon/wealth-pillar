/**
 * Report Period Service
 * Business logic for calculating earned/spent metrics from transactions
 * based on budget periods
 * 
 * Note: This service now leverages FinanceLogicService for core calculations.
 */

import type { Account, BudgetPeriod, Transaction, User, CategoryBreakdownItem } from '@/lib/types';
import { FinanceLogicService } from './finance-logic.service';

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
 * Handles budget period calculations and enrichment by wrapping FinanceLogicService.
 */
export class ReportPeriodService {
  /**
   * Filter transactions within a budget period date range
   */
  static filterTransactionsByPeriod(
    transactions: Transaction[],
    startDate: string | Date,
    endDate: string | Date | null
  ): Transaction[] {
    return FinanceLogicService.filterTransactionsByPeriod(transactions, startDate, endDate);
  }

  /**
   * Calculate category breakdown from transactions with NET analysis
   */
  static calculateCategoryBreakdown(
    transactions: Transaction[]
  ): CategoryBreakdownItem[] {
    return FinanceLogicService.calculateCategoryBreakdown(transactions);
  }

  /**
   * Enrich budget periods with calculated metrics
   * Combines period data with transaction analysis
   *
   * @complexity O(u + a×u + p×t) - Pre-indexing users/accounts, then O(t) per period
   */
  static enrichBudgetPeriods(
    budgetPeriods: BudgetPeriod[],
    users: User[],
    transactions: Transaction[],
    accounts: Account[]
  ): EnrichedBudgetPeriod[] {
    // Pre-index users by ID for O(1) lookup
    const userMap = new Map(users.map(u => [u.id, u]));

    // Pre-compute account IDs per user for O(1) lookup
    const accountIdsByUser = new Map<string, string[]>();
    for (const account of accounts) {
      for (const userId of account.user_ids) {
        if (!accountIdsByUser.has(userId)) {
          accountIdsByUser.set(userId, []);
        }
        accountIdsByUser.get(userId)!.push(account.id);
      }
    }

    return budgetPeriods.map((period) => {
      const user = userMap.get(period.user_id);
      const userName = user?.name || 'Unknown User';
      const userAccountIds = accountIdsByUser.get(period.user_id) || [];

      // Filter transactions for this period and user
      const periodTransactions = FinanceLogicService.filterTransactionsByPeriod(
        transactions,
        period.start_date,
        period.end_date
      );

      const userTransactions = periodTransactions.filter(
        t => t.user_id === period.user_id
      );

      // Calculate metrics using FinanceLogicService
      const overview = FinanceLogicService.calculateOverviewMetrics(userTransactions, userAccountIds);
      const internalTransfers = FinanceLogicService.calculateInternalTransfers(userTransactions, userAccountIds);
      const categoryBreakdown = FinanceLogicService.calculateCategoryBreakdown(userTransactions);

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
        totalEarned: overview.totalEarned,
        totalSpent: overview.totalSpent,
        totalGain: overview.totalBalance,
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
