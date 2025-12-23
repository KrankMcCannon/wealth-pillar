/**
 * Finance Logic Service
 *
 * Centralized business logic for all financial calculations across the application.
 * Serves as the single source of truth for:
 * - Transaction filtering (by period, user, account)
 * - Balance calculations (account-based vs budget-based)
 * - Category breakdown and NET analysis
 * - Performance-optimized lookups using Map/Set
 */

import type { Transaction, CategoryBreakdownItem } from '@/lib/types';
import {
  toDateTime,
  isInRange,
  now as luxonNow,
} from '@/lib/utils/date-utils';
import type { DateInput } from '@/lib/utils/date-utils';

export interface OverviewMetrics {
  totalEarned: number;
  totalSpent: number;
  totalTransferred: number;
  totalBalance: number;
}

export interface AccountBasedMetrics {
  moneyIn: number;
  moneyOut: number;
  balance: number;
  internalTransfers: number;
}

export interface BudgetBasedMetrics {
  budgetIncrease: number;
  budgetDecrease: number;
  balance: number;
}

export class FinanceLogicService {
  /**
   * Filter transactions within a date range
   * @complexity O(n)
   */
  static filterTransactionsByPeriod(
    transactions: Transaction[],
    startDate: DateInput,
    endDate: DateInput
  ): Transaction[] {
    const periodStart = toDateTime(startDate);
    if (!periodStart) return [];
    const normalizedStart = periodStart.startOf('day');

    const periodEnd = endDate ? toDateTime(endDate) : luxonNow();
    if (!periodEnd) return [];
    const normalizedEnd = periodEnd.endOf('day');

    return transactions.filter((t) => {
      const txDate = toDateTime(t.date);
      if (!txDate) return false;
      return txDate >= normalizedStart && txDate <= normalizedEnd;
    });
  }

  /**
   * Calculate overall metrics
   * @complexity O(n)
   */
  static calculateOverviewMetrics(
    transactions: Transaction[],
    userAccountIds: string[],
    userId?: string
  ): OverviewMetrics {
    const accountSet = new Set(userAccountIds);
    let totalEarned = 0;
    let totalSpent = 0;
    let totalTransferred = 0;

    for (const t of transactions) {
      if (userId && t.user_id !== userId) continue;

      if (t.type === 'income' && accountSet.has(t.account_id)) {
        totalEarned += t.amount;
      } else if (t.type === 'expense' && accountSet.has(t.account_id)) {
        totalSpent += t.amount;
      } else if (t.type === 'transfer') {
        const fromUserAccount = accountSet.has(t.account_id);
        const toUserAccount = t.to_account_id && accountSet.has(t.to_account_id);

        if (fromUserAccount) {
          totalTransferred += t.amount;
        }

        if (fromUserAccount && toUserAccount) {
          continue; // Internal transfer
        } else if (fromUserAccount) {
          totalSpent += t.amount; // External OUT
        } else if (toUserAccount) {
          totalEarned += t.amount; // External IN
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
   * Calculate account-based metrics (real cash flow)
   * @complexity O(n)
   */
  static calculateAccountBasedMetrics(
    transactions: Transaction[],
    userAccountIds: string[],
    userId?: string
  ): AccountBasedMetrics {
    const accountSet = new Set(userAccountIds);
    let moneyIn = 0;
    let moneyOut = 0;
    let internalTransfers = 0;
    let totalTransferred = 0;

    for (const t of transactions) {
      if (userId && t.user_id !== userId) continue;

      if (t.type === 'income' && accountSet.has(t.account_id)) {
        moneyIn += t.amount;
      } else if (t.type === 'expense' && accountSet.has(t.account_id)) {
        moneyOut += t.amount;
      } else if (t.type === 'transfer' && accountSet.has(t.account_id)) {
        totalTransferred += t.amount;
        if (t.to_account_id && accountSet.has(t.to_account_id)) {
          internalTransfers += t.amount;
        } else {
          moneyOut += t.amount;
        }
      } else if (t.type === 'transfer' && t.to_account_id && accountSet.has(t.to_account_id)) {
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
   * Calculate budget-based metrics (full budget impact)
   * @complexity O(n)
   */
  static calculateBudgetBasedMetrics(
    transactions: Transaction[],
    userAccountIds: string[],
    userId?: string
  ): BudgetBasedMetrics {
    const accountSet = new Set(userAccountIds);
    let budgetIncrease = 0;
    let budgetDecrease = 0;
    let totalTransferred = 0;

    for (const t of transactions) {
      if (userId && t.user_id !== userId) continue;

      if (t.type === 'income' && accountSet.has(t.account_id)) {
        budgetIncrease += t.amount;
      } else if (t.type === 'expense' && accountSet.has(t.account_id)) {
        budgetDecrease += t.amount;
      } else if (t.type === 'transfer' && accountSet.has(t.account_id)) {
        totalTransferred += t.amount;
        if (!t.to_account_id || !accountSet.has(t.to_account_id)) {
          budgetDecrease += t.amount;
        }
      } else if (t.type === 'transfer' && t.to_account_id && accountSet.has(t.to_account_id)) {
        budgetIncrease += t.amount;
      }
    }

    return {
      budgetIncrease,
      budgetDecrease,
      balance: budgetIncrease - budgetDecrease - totalTransferred,
    };
  }

  /**
   * Calculate internal transfers
   * @complexity O(n)
   */
  static calculateInternalTransfers(
    transactions: Transaction[],
    userAccountIds: string[]
  ): number {
    const accountSet = new Set(userAccountIds);
    return transactions
      .filter(t =>
        t.type === 'transfer' &&
        t.to_account_id &&
        accountSet.has(t.account_id) &&
        accountSet.has(t.to_account_id)
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }

  /**
   * Calculate category breakdown with NET analysis
   * @complexity O(n + m log m)
   */
  static calculateCategoryBreakdown(
    transactions: Transaction[]
  ): CategoryBreakdownItem[] {
    if (transactions.length === 0) return [];
    const categoryMap = new Map<string, { spent: number; received: number; count: number }>();

    for (const t of transactions) {
      if (t.type === 'transfer') continue;
      const existing = categoryMap.get(t.category) || { spent: 0, received: 0, count: 0 };
      if (t.type === 'expense') {
        existing.spent += t.amount;
        existing.count += 1;
      } else if (t.type === 'income') {
        existing.received += t.amount;
        existing.count += 1;
      }
      categoryMap.set(t.category, existing);
    }

    const breakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      spent: data.spent,
      received: data.received,
      net: data.spent - data.received,
      percentage: 0,
      count: data.count
    }));

    const totalNetSpending = breakdown
      .filter(item => item.net > 0)
      .reduce((sum, item) => sum + item.net, 0);

    for (const item of breakdown) {
      item.percentage = (item.net > 0 && totalNetSpending > 0)
        ? (item.net / totalNetSpending) * 100
        : 0;
    }

    return breakdown.sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
  }

  /**
   * Calculate total money in (Income + ALL transfers in)
   * @complexity O(n)
   */
  static calculateTotalIn(
    transactions: Transaction[],
    userAccountIds: string[],
    userId?: string
  ): number {
    const accountSet = new Set(userAccountIds);
    return transactions.reduce((sum, t) => {
      if (userId && t.user_id !== userId) return sum;

      // Income to user accounts
      if (t.type === 'income' && accountSet.has(t.account_id)) {
        return sum + t.amount;
      }

      // ANY transfer IN to user accounts
      if (t.type === 'transfer' && t.to_account_id && accountSet.has(t.to_account_id)) {
        return sum + t.amount;
      }

      return sum;
    }, 0);
  }

  /**
   * Calculate total money out (Expense + ALL transfers out)
   * @complexity O(n)
   */
  static calculateTotalOut(
    transactions: Transaction[],
    userAccountIds: string[],
    userId?: string
  ): number {
    const accountSet = new Set(userAccountIds);
    return transactions.reduce((sum, t) => {
      if (userId && t.user_id !== userId) return sum;

      // Expense from user accounts
      if (t.type === 'expense' && accountSet.has(t.account_id)) {
        return sum + t.amount;
      }

      // ANY transfer OUT from user accounts
      if (t.type === 'transfer' && accountSet.has(t.account_id)) {
        return sum + t.amount;
      }

      return sum;
    }, 0);
  }

  /**
   * Filter transactions by categories
   * @complexity O(n)
   */
  static filterByCategories(
    transactions: Transaction[],
    categories: string[]
  ): Transaction[] {
    const categorySet = new Set(categories);
    return transactions.filter(t => categorySet.has(t.category));
  }

  /**
   * Filter transactions by period using utilities
   * @complexity O(n)
   */
  static filterByPeriodInRange(
    transactions: Transaction[],
    startDate: DateInput,
    endDate: DateInput
  ): Transaction[] {
    return transactions.filter(t => isInRange(t.date, startDate, endDate));
  }

  /**
   * Filter transactions by month and year
   * @complexity O(n)
   */
  static filterByMonth(
    transactions: Transaction[],
    year: number,
    month: number
  ): Transaction[] {
    return transactions.filter((t) => {
      const dt = toDateTime(t.date);
      return dt && dt.year === year && dt.month === month + 1;
    });
  }

  /**
   * Calculate historical balance for a specific account
   * Reverses transactions from current balance back to target date
   * 
   * @complexity O(n)
   */
  static calculateHistoricalBalance(
    allTransactions: Transaction[],
    accountId: string,
    currentBalance: number,
    targetDate: DateInput
  ): number {
    // We want the balance at the BEGINNING of the target date
    // So we must reverse all transactions that happened ON or AFTER the target date
    const targetDt = toDateTime(targetDate)?.startOf('day');
    if (!targetDt) return currentBalance;

    // Filter transactions that happened ON or AFTER the target date
    const futureTransactions = allTransactions.filter(t => {
      const tDate = toDateTime(t.date);
      return tDate && tDate >= targetDt;
    });

    let historicalBalance = currentBalance;

    for (const t of futureTransactions) {
      const isSource = t.account_id === accountId;
      const isDest = t.to_account_id === accountId;

      if (!isSource && !isDest) continue;

      // REVERSE the effect of the transaction
      if (t.type === 'expense' && isSource) {
        historicalBalance += t.amount; // Add back spent money
      } else if (t.type === 'income' && isSource) {
        historicalBalance -= t.amount; // Remove received money
      } else if (t.type === 'transfer') {
        if (isSource) {
          historicalBalance += t.amount; // Add back money sent out
        } else if (isDest) {
          historicalBalance -= t.amount; // Remove money received
        }
      }
    }

    return historicalBalance;
  }

  /**
   * Calculate total spent (expenses + outgoing transfers) for an account in a period
   * 
   * @complexity O(n)
   */
  static calculatePeriodTotalSpent(
    periodTransactions: Transaction[],
    accountId: string
  ): number {
    return periodTransactions.reduce((sum, t) => {
      if (t.account_id !== accountId) return sum;

      if (t.type === 'expense' || t.type === 'transfer') {
        return sum + t.amount;
      }
      return sum;
    }, 0);
  }

  /**
   * Calculate internal transfers OUT for a specific account
   * Used to adjust balance calculations when "Total Spent" excludes internal transfers
   * 
   * @complexity O(n)
   */
  static calculatePeriodInternalTransfersOut(
    periodTransactions: Transaction[],
    accountId: string,
    userAccountIds: string[]
  ): number {
    const userAccountSet = new Set(userAccountIds);

    return periodTransactions.reduce((sum, t) => {
      if (t.account_id !== accountId) return sum;
      if (t.type !== 'transfer') return sum;

      // Only count transfers to other user accounts
      if (t.to_account_id && userAccountSet.has(t.to_account_id)) {
        return sum + t.amount;
      }

      return sum;
    }, 0);
  }

  /**
   * Calculate total income (income + incoming transfers) for an account in a period
   * 
   * @complexity O(n)
   */
  static calculatePeriodTotalIncome(
    periodTransactions: Transaction[],
    accountId: string
  ): number {
    return periodTransactions.reduce((sum, t) => {
      // Direct income to account
      if (t.account_id === accountId && t.type === 'income') {
        return sum + t.amount;
      }

      // Transfer IN to account
      if (t.to_account_id === accountId && t.type === 'transfer') {
        return sum + t.amount;
      }

      return sum;
    }, 0);
  }

  /**
   * Calculate total transfers (absolute sum of IN and OUT) for a specific account
   * 
   * @complexity O(n)
   */
  static calculatePeriodTotalTransfers(
    periodTransactions: Transaction[],
    accountId: string
  ): number {
    return periodTransactions.reduce((sum, t) => {
      if (t.type !== 'transfer') return sum;

      const isRelated = t.account_id === accountId || t.to_account_id === accountId;
      if (isRelated) {
        return sum + t.amount;
      }
      return sum;
    }, 0);
  }

  /**
   * Calculate annual category spending
   * Returns category breakdown for the current year (or specified year)
   * 
   * @complexity O(n)
   */
  static calculateAnnualCategorySpending(
    allTransactions: Transaction[],
    year: number = new Date().getFullYear()
  ): CategoryBreakdownItem[] {
    const annualTransactions = allTransactions.filter(t => {
      const dt = toDateTime(t.date);
      return dt?.year === year;
    });

    return this.calculateCategoryBreakdown(annualTransactions);
  }
}
