/**
 * Report Period Service
 * Business logic for calculating earned/spent metrics from transactions
 * based on budget periods
 * 
 * Note: This service now leverages FinanceLogicService for core calculations.
 */

import type { Account, BudgetPeriod, Transaction, User, CategoryBreakdownItem } from '@/lib/types';
import { FinanceLogicService } from './finance-logic.service';
import { subtractDays, toDateTime } from '@/lib/utils/date-utils';

/**
 * Enhanced budget period with calculated metrics including NET analysis
 */
export interface EnrichedBudgetPeriod extends BudgetPeriod {
  userName: string;
  transactions: Transaction[];   // Sorted by amount descending
  defaultAccountStartBalance: number | null; // NEW: Sequential Start Balance
  defaultAccountEndBalance: number | null;   // NEW: Sequential End Balance
  periodTotalSpent: number;      // NEW: Expenses + Transfers Out
  periodTotalIncome: number;     // NEW: Income + Transfers In
  periodTotalTransfers: number;  // NEW: Total related transfers (In + Out)
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

    // 1. Enrich periods with basic metrics first (Income/Spent)
    const partiallyEnriched = budgetPeriods.map((period) => {
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

      // Basic Period Totals (Income/Spent)
      let periodTotalSpent = 0;
      let periodTotalIncome = 0;
      let periodTotalTransfers = 0;
      const defaultAccountId = user?.default_account_id;

      if (defaultAccountId) {
        periodTotalSpent = FinanceLogicService.calculatePeriodTotalSpent(
          userTransactions,
          defaultAccountId,
          userAccountIds
        );

        periodTotalIncome = FinanceLogicService.calculatePeriodTotalIncome(
          userTransactions,
          defaultAccountId
        );

        periodTotalTransfers = FinanceLogicService.calculatePeriodTotalTransfers(
          userTransactions,
          defaultAccountId
        );
      }

      // Sort transactions by amount descending
      const sortedTransactions = [...userTransactions].sort((a, b) => b.amount - a.amount);

      return {
        ...period,
        userName,
        transactions: sortedTransactions,
        defaultAccountStartBalance: null as number | null,
        defaultAccountEndBalance: null as number | null,
        periodTotalSpent,
        periodTotalIncome,
        periodTotalTransfers,
      };
    });

    // 2. Apply Sequential Forward Accumulation for Default Account Balances
    // Group by User
    const periodsByUser = new Map<string, typeof partiallyEnriched>();
    for (const p of partiallyEnriched) {
      if (!periodsByUser.has(p.user_id)) {
        periodsByUser.set(p.user_id, []);
      }
      periodsByUser.get(p.user_id)!.push(p);
    }

    // Process each user's timeline
    const fullyEnriched: EnrichedBudgetPeriod[] = [];

    periodsByUser.forEach((userPeriods, userId) => {
      // Sort by Start Date Ascending
      userPeriods.sort((a, b) => {
        const da = toDateTime(a.start_date);
        const db = toDateTime(b.start_date);
        if (!da || !db) return 0;
        return da.toMillis() - db.toMillis();
      });

      const user = userMap.get(userId);
      const defaultAccountId = user?.default_account_id;

      if (defaultAccountId) {
        let runningBalance = 0; // First period starts at 0

        for (let i = 0; i < userPeriods.length; i++) {
          const p = userPeriods[i];

          // Calculate Internal Transfers OUT for the default account in this period
          // Only needed for correcting the balance calculation since p.periodTotalSpent now excludes them
          const periodInternalTransfersOut = FinanceLogicService.calculatePeriodInternalTransfersOut(
            p.transactions,
            defaultAccountId,
            accountIdsByUser.get(userId) || []
          );

          p.defaultAccountStartBalance = runningBalance;

          // End Balance = Start + Income - (Expenses + Internal Transfers Out)
          // Note: p.periodTotalSpent now EXCLUDES internal transfers out, so we must subtract them explicitly
          const netChange = p.periodTotalIncome - p.periodTotalSpent - periodInternalTransfersOut;

          p.defaultAccountEndBalance = runningBalance + netChange;

          // Update running balance for next period
          runningBalance = p.defaultAccountEndBalance;

          fullyEnriched.push(p);
        }
      } else {
        // No default account, just push as is
        fullyEnriched.push(...userPeriods);
      }
    });

    return fullyEnriched;
  }
}
