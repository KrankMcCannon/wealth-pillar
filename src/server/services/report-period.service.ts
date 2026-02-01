/**
 * Report Period Service
 * Business logic for calculating earned/spent metrics from transactions
 * based on budget periods
 * 
 * Note: This service now leverages FinanceLogicService for core calculations.
 */

import type { Account, BudgetPeriod, Transaction, User } from '@/lib/types';
import { FinanceLogicService } from './finance-logic.service';
import { toDateTime } from '@/lib/utils/date-utils';

/**
 * Enhanced budget period with calculated metrics including NET analysis
 */
export interface EnrichedBudgetPeriod extends BudgetPeriod {
  userName: string;
  transactions: Transaction[]; // Sorted by amount descending
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
    const activeAccountIdsByUser = new Map<string, Set<string>>();

    for (const account of accounts) {
      // Filter for Payroll only (aligned with Dashboard)
      if (account.type !== 'payroll') continue;

      for (const userId of account.user_ids) {
        if (!activeAccountIdsByUser.has(userId)) {
          activeAccountIdsByUser.set(userId, new Set());
        }
        activeAccountIdsByUser.get(userId)!.add(account.id);
      }
    }

    // 1. Enrich periods with basic metrics first (Income/Spent)
    const partiallyEnriched = budgetPeriods.map((period) => {
      const user = userMap.get(period.user_id);
      const userName = user?.name || 'Unknown User';
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
      // identifying the set of active accounts for this user
      const userActiveAccounts = activeAccountIdsByUser.get(period.user_id) || new Set<string>();

      if (userActiveAccounts.size > 0) {
        periodTotalSpent = FinanceLogicService.calculatePeriodTotalSpent(
          userTransactions,
          userActiveAccounts
        );
        periodTotalIncome = FinanceLogicService.calculatePeriodTotalIncome(
          userTransactions,
          userActiveAccounts
        );
        periodTotalTransfers = FinanceLogicService.calculatePeriodTotalTransfers(
          userTransactions,
          userActiveAccounts
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

      const userActiveAccounts = activeAccountIdsByUser.get(userId) || new Set<string>();

      if (userActiveAccounts.size > 0) {
        const userAccounts = accounts.filter(a => userActiveAccounts.has(a.id));
        const currentBalance = FinanceLogicService.calculateAggregatedBalance(userAccounts);

        const firstPeriodStart = userPeriods[0]?.start_date;
        let runningBalance = 0;

        if (firstPeriodStart) {
          runningBalance = FinanceLogicService.calculateHistoricalBalance(
            transactions,
            userActiveAccounts,
            currentBalance,
            firstPeriodStart
          );
        }

        for (const element of userPeriods) {
          const p = element;

          p.defaultAccountStartBalance = runningBalance;

          // End Balance = Start + Income - Spent
          // Note: Income includes transfers IN, Spent includes transfers OUT
          const netChange = p.periodTotalIncome - p.periodTotalSpent;

          p.defaultAccountEndBalance = runningBalance + netChange;

          // Update running balance for next period
          runningBalance = p.defaultAccountEndBalance;

          fullyEnriched.push(p);
        }
      } else {
        // No active accounts, just push as is
        fullyEnriched.push(...userPeriods);
      }
    });

    return fullyEnriched;
  }
}
