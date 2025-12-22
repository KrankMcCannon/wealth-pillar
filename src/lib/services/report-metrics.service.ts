/**
 * Report Metrics Service
 * Comprehensive financial metrics calculations for reports page
 * Provides both account-based and budget-based perspectives
 */

import type { Transaction } from '@/lib/types';

/**
 * Overall report metrics across all transactions
 */
export interface OverviewMetrics {
  totalEarned: number;      // Total income + incoming transfers
  totalSpent: number;       // Total expenses + outgoing transfers
  totalTransferred: number; // Sum of all transfer amounts
  totalBalance: number;     // Net balance (earned - spent)
}

/**
 * Account-based metrics (excludes internal transfers)
 * Represents real cash flow in/out of the account ecosystem
 */
export interface AccountBasedMetrics {
  moneyIn: number;          // Income + transfers from external accounts
  moneyOut: number;         // Expenses + transfers to external accounts
  balance: number;          // Net account-based balance
  internalTransfers: number; // Total internal transfers (for reference)
}

/**
 * Budget-based metrics (includes all transfers)
 * Represents full budget impact including internal movements
 */
export interface BudgetBasedMetrics {
  budgetIncrease: number;   // All money increasing budget total
  budgetDecrease: number;   // All money decreasing budget total
  balance: number;          // Net budget-based balance
}

/**
 * Report Metrics Service
 * Handles comprehensive financial calculations for the reports page
 * 
 * Design principles:
 * - All methods are pure functions (no side effects)
 * - Optimized with Set for O(1) lookups
 * - Clear separation between account-based and budget-based perspectives
 */
export class ReportMetricsService {
  /**
   * Calculate overall metrics across all transactions
   * 
   * @param transactions - All transactions to analyze
   * @param userAccountIds - Array of account IDs belonging to the user(s)
   * @param userId - Optional user ID to filter transactions (omit for "all members")
   * @returns Overview metrics with totals
   * 
   * @example
   * const metrics = ReportMetricsService.calculateOverviewMetrics(
   *   transactions, 
   *   ['acc1', 'acc2'], 
   *   'user123'
   * );
   * 
   * @complexity O(n) - Single pass through transactions
   */
  static calculateOverviewMetrics(
    transactions: Transaction[],
    userAccountIds: string[],
    userId?: string
  ): OverviewMetrics {
    // OPTIMIZATION: Use Set for O(1) account lookup
    const accountSet = new Set(userAccountIds);

    let totalEarned = 0;
    let totalSpent = 0;
    let totalTransferred = 0;

    for (const t of transactions) {
      // Filter by user if specified
      if (userId && t.user_id !== userId) {
        continue;
      }

      // Handle income
      if (t.type === 'income' && accountSet.has(t.account_id)) {
        totalEarned += t.amount;
      }

      // Handle expenses
      else if (t.type === 'expense' && accountSet.has(t.account_id)) {
        totalSpent += t.amount;
      }

      // Handle transfers - check if internal or external
      else if (t.type === 'transfer') {
        const fromUserAccount = accountSet.has(t.account_id);
        const toUserAccount = t.to_account_id && accountSet.has(t.to_account_id);

        // Track total transferred amount (only count once per transfer)
        if (fromUserAccount) {
          totalTransferred += t.amount;
        }

        if (fromUserAccount && toUserAccount) {
          // Internal transfer - don't count in earned/spent
          // This is just money moving between user's own accounts
          continue;
        } else if (fromUserAccount) {
          // Transfer OUT to external account - counts as spent
          totalSpent += t.amount;
        } else if (toUserAccount) {
          // Transfer IN from external account - counts as earned
          totalEarned += t.amount;
        }
      }
    }

    return {
      totalEarned,
      totalSpent,
      totalTransferred,
      totalBalance: totalEarned - totalSpent,
    };
  }

  /**
   * Calculate account-based metrics (excludes internal transfers)
   * This represents real cash flow - money actually entering or leaving the account ecosystem
   * 
   * Internal transfers (between user's own accounts) are excluded because they don't
   * represent real spending or earning, just movement within the same ecosystem.
   * 
   * @param transactions - All transactions to analyze
   * @param userAccountIds - Array of account IDs belonging to the user(s)
   * @param userId - Optional user ID to filter transactions
   * @returns Account-based metrics excluding internal transfers
   * 
   * @example
   * const accountMetrics = ReportMetricsService.calculateAccountBasedMetrics(
   *   periodTransactions,
   *   userAccountIds,
   *   'user123'
   * );
   * 
   * @complexity O(n) - Single pass through transactions
   */
  static calculateAccountBasedMetrics(
    transactions: Transaction[],
    userAccountIds: string[],
    userId?: string
  ): AccountBasedMetrics {
    // OPTIMIZATION: Use Set for O(1) account lookup
    const accountSet = new Set(userAccountIds);

    let moneyIn = 0;
    let moneyOut = 0;
    let internalTransfers = 0;
    let totalTransferred = 0; // Track ALL transfers OUT (internal + external)

    for (const t of transactions) {
      // Filter by user if specified
      if (userId && t.user_id !== userId) {
        continue;
      }

      if (t.type === 'income' && accountSet.has(t.account_id)) {
        // Income always counts as money in
        moneyIn += t.amount;
      } else if (t.type === 'expense' && accountSet.has(t.account_id)) {
        // Expenses always count as money out
        moneyOut += t.amount;
      } else if (t.type === 'transfer' && accountSet.has(t.account_id)) {
        // ANY transfer OUT from user accounts (internal or external)
        const toUserAccount = t.to_account_id && accountSet.has(t.to_account_id);

        // Track total transferred for balance calculation
        totalTransferred += t.amount;

        if (toUserAccount) {
          // Internal transfer - track separately but don't count in money in/out
          internalTransfers += t.amount;
        } else {
          // Transfer OUT to external account
          moneyOut += t.amount;
        }
      } else if (t.type === 'transfer' && t.to_account_id && accountSet.has(t.to_account_id)) {
        // Transfer IN from external account
        moneyIn += t.amount;
      }
    }

    return {
      moneyIn,
      moneyOut,
      balance: moneyIn - moneyOut - totalTransferred,
      internalTransfers,
    };
  }

  /**
   * Calculate budget-based metrics (includes all transfers)
   * This represents the full budget impact, including internal movements
   * 
   * All transfers are counted because they affect the budget allocation,
   * even if they're just moving money between accounts.
   * 
   * @param transactions - All transactions to analyze
   * @param userAccountIds - Array of account IDs belonging to the user(s)
   * @param userId - Optional user ID to filter transactions
   * @returns Budget-based metrics including all transfers
   * 
   * @example
   * const budgetMetrics = ReportMetricsService.calculateBudgetBasedMetrics(
   *   periodTransactions,
   *   userAccountIds,
   *   'user123'
   * );
   * 
   * @complexity O(n) - Single pass through transactions
   */
  static calculateBudgetBasedMetrics(
    transactions: Transaction[],
    userAccountIds: string[],
    userId?: string
  ): BudgetBasedMetrics {
    // OPTIMIZATION: Use Set for O(1) account lookup
    const accountSet = new Set(userAccountIds);

    let budgetIncrease = 0;
    let budgetDecrease = 0;
    let totalTransferred = 0; // Track ALL transfers OUT (internal + external)

    for (const t of transactions) {
      // Filter by user if specified
      if (userId && t.user_id !== userId) {
        continue;
      }

      if (t.type === 'income' && accountSet.has(t.account_id)) {
        // Income increases budget
        budgetIncrease += t.amount;
      } else if (t.type === 'expense' && accountSet.has(t.account_id)) {
        // Expenses decrease budget
        budgetDecrease += t.amount;
      } else if (t.type === 'transfer' && accountSet.has(t.account_id)) {
        // ANY transfer OUT from user accounts (internal or external)
        const toUserAccount = t.to_account_id && accountSet.has(t.to_account_id);

        // Track total transferred for balance calculation
        totalTransferred += t.amount;

        if (!toUserAccount) {
          // External transfer decreases budget
          budgetDecrease += t.amount;
        }
        // Internal transfers don't affect budgetIncrease/budgetDecrease
      } else if (t.type === 'transfer' && t.to_account_id && accountSet.has(t.to_account_id)) {
        // Transfer IN from external account increases budget
        budgetIncrease += t.amount;
      }
    }

    return {
      budgetIncrease,
      budgetDecrease,
      // Subtract ALL transfers from balance (internal + external)
      balance: budgetIncrease - budgetDecrease - totalTransferred,
    };
  }

  /**
   * Calculate total transferred amount (all transfers involving user accounts)
   * 
   * @param transactions - All transactions to analyze
   * @param userAccountIds - Array of account IDs belonging to the user(s)
   * @param userId - Optional user ID to filter transactions
   * @returns Total amount transferred
   * 
   * @complexity O(n) - Single pass through transactions
   */
  static calculateTotalTransferred(
    transactions: Transaction[],
    userAccountIds: string[],
    userId?: string
  ): number {
    const accountSet = new Set(userAccountIds);

    return transactions.reduce((sum, t) => {
      // Filter by user if specified
      if (userId && t.user_id !== userId) {
        return sum;
      }

      // Count transfers where account_id belongs to user
      if (t.type === 'transfer' && accountSet.has(t.account_id)) {
        return sum + t.amount;
      }

      return sum;
    }, 0);
  }
}
