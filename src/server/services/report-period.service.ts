/**
 * Report Period Service
 * Business logic for calculating earned/spent metrics from transactions
 * based on budget periods
 *
 * Note: This service now leverages FinanceLogicService for core calculations.
 */

import type { Account, BudgetPeriod, Transaction, User, BudgetPeriodJSON } from '@/lib/types';
import { FinanceLogicService } from './finance-logic.service';
import { toDateTime } from '@/lib/utils'; // formatDateShort removed as unused

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
   * Process raw user periods, identify active ones, and generate synthetic ones if needed.
   * This centralizes logic previously in ReportsService.
   */
  static processUserPeriods(user: User): BudgetPeriod[] {
    let userPeriods: BudgetPeriod[] = [];

    // 1. Parse existing periods
    if (Array.isArray(user.budget_periods)) {
      // Safely cast and map
      userPeriods = (user.budget_periods as BudgetPeriodJSON[]).map((bp) => ({
        ...bp,
        user_id: user.id
      })) as BudgetPeriod[];
    }

    // 2. CHECK: Does this user have an Active Period? 
    // STRICT RULE: is_active === true AND end_date is null
    const hasActive = userPeriods.some(p => p.is_active && !p.end_date);

    if (!hasActive) {
      this.addSyntheticActivePeriod(user, userPeriods);
    }

    return userPeriods;
  }

  /**
   * Helper to generate and add a synthetic active period if one is missing.
   */
  private static addSyntheticActivePeriod(user: User, periods: BudgetPeriod[]) {
    // Determine Start Date:
    // 1. Day after last period ends
    // 2. Or fallback to budget_start_date for this month
    let startDateStr = new Date().toISOString().split('T')[0]; // Default fallback

    if (periods.length > 0) {
      // Find latest end date
      // Sort by end_date descending. '9999...' ensures nulls (if any exist erroneously) go to top, 
      // but here we are looking for the latest *completed* date to start *after*.
      const sortedByEnd = [...periods].sort((a, b) => {
        const aEnd = a.end_date ? String(a.end_date) : '0000-00-00';
        const bEnd = b.end_date ? String(b.end_date) : '0000-00-00';
        if (bEnd < aEnd) return -1;
        if (bEnd > aEnd) return 1;
        return 0;
      });

      const lastPeriod = sortedByEnd[0];
      if (lastPeriod && lastPeriod.end_date) {
        // Next day calculation
        const lastEnd = new Date(lastPeriod.end_date);
        lastEnd.setDate(lastEnd.getDate() + 1);
        startDateStr = lastEnd.toISOString().split('T')[0];
      }
    } else if (user.budget_start_date) {
      // Logic to find "This Month's" start date based on day preference
      const now = new Date();
      const day = user.budget_start_date;
      // Construct date for this month
      const validDate = new Date(now.getFullYear(), now.getMonth(), day);

      // If today is before the start date, it surely started last month
      if (now < validDate) {
        validDate.setMonth(validDate.getMonth() - 1);
      }

      const year = validDate.getFullYear();
      const month = String(validDate.getMonth() + 1).padStart(2, '0');
      const d = String(validDate.getDate()).padStart(2, '0');
      startDateStr = `${year}-${month}-${d}`;
    }

    // Only add if startDate is valid 
    if (startDateStr <= new Date().toISOString().split('T')[0]) {
      const nowIso = new Date().toISOString();
      periods.push({
        id: `active-generated-${user.id}`,
        start_date: startDateStr,
        end_date: null, // STRICTLY NULL for active
        is_active: true,
        user_id: user.id,
        created_at: nowIso,
        updated_at: nowIso
      });
    }
  }

  /**
   * Filter periods that overlap with the requested range
   */
  static filterPeriodsByRange(
    allPeriods: BudgetPeriod[],
    startDate?: string,
    endDate?: string
  ): BudgetPeriod[] {
    if (!startDate && !endDate) return allPeriods;

    return allPeriods.filter(p => {
      // ALWAYS include active periods (no end_date) as per user request
      if (!p.end_date) return true;

      let inRange = true;
      // Check overlap logic carefully
      // Period [start, end] overlaps with Range [reqStart, reqEnd] if:
      // start <= reqEnd AND end >= reqStart

      if (startDate && p.end_date < startDate) inRange = false; // Ends before range starts
      // Note: If endDate is provided, we used to check p.end_date > endDate. 
      // STRICT FILTER: If user asks for report until X, do we show periods ending after X?
      // Usually "Report for Jan" implies periods *ending* in Jan???
      // Original logic was: if (params.endDate && p.end_date > params.endDate) inRange = false;
      // We will keep faithful to original logic for now.
      if (endDate && p.end_date > endDate) inRange = false;

      return inRange;
    });
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

    // Pre-compute account IDs and objects per user for O(1) lookup
    const activeAccountIdsByUser = new Map<string, Set<string>>();
    const activeAccountsByUser = new Map<string, Account[]>();

    for (const account of accounts) {
      // Filter for Payroll only (aligned with Dashboard)
      if (account.type !== 'payroll') continue;

      for (const userId of account.user_ids) {
        if (!activeAccountIdsByUser.has(userId)) {
          activeAccountIdsByUser.set(userId, new Set());
          activeAccountsByUser.set(userId, []);
        }
        activeAccountIdsByUser.get(userId)!.add(account.id);
        activeAccountsByUser.get(userId)!.push(account);
      }
    }

    // Pre-sort transactions to avoid sorting repeatedly? 
    // Sorting per subset is usually fine, but if N is huge, might be better to sort once.
    // However, we filter per period anyway.

    // 1. Group periods by User to optimize sequential processing
    const periodsByUser = new Map<string, BudgetPeriod[]>();
    for (const p of budgetPeriods) {
      if (!periodsByUser.has(p.user_id)) periodsByUser.set(p.user_id, []);
      periodsByUser.get(p.user_id)!.push(p);
    }

    const fullyEnriched: EnrichedBudgetPeriod[] = [];

    // Process each user
    periodsByUser.forEach((userPeriods, userId) => {
      const user = userMap.get(userId);
      const userName = user?.name || 'Unknown User';
      const userActiveAccountIds = activeAccountIdsByUser.get(userId) || new Set<string>();
      const userActiveAccounts = activeAccountsByUser.get(userId) || [];

      // Sort periods by Start Date Ascending for sequential balance calculation
      userPeriods.sort((a, b) => {
        const da = toDateTime(a.start_date);
        const db = toDateTime(b.start_date);
        if (!da || !db) return 0;
        return da.toMillis() - db.toMillis();
      });

      // Calculate initial historical balance if needed
      // Find current aggregate balance
      let runningBalance = 0;
      if (userActiveAccounts.length > 0) {
        const currentBalance = FinanceLogicService.calculateAggregatedBalance(userActiveAccounts);
        const firstPeriodStart = userPeriods[0]?.start_date;
        if (firstPeriodStart) {
          runningBalance = FinanceLogicService.calculateHistoricalBalance(
            transactions,
            userActiveAccountIds,
            currentBalance,
            firstPeriodStart
          );
        }
      }

      // Pre-filter transactions for this user??
      // Optimization: filter transactions once by user if possible.
      const rawUserTransactions = transactions.filter(t => t.user_id === userId);

      // Process periods sequentially
      for (const period of userPeriods) {
        // Filter transactions for this specific period
        const periodTransactions = FinanceLogicService.filterTransactionsByPeriod(
          rawUserTransactions,
          period.start_date,
          period.end_date
        );

        // Calculate metrics
        let periodTotalSpent = 0;
        let periodTotalIncome = 0;
        let periodTotalTransfers = 0;

        if (userActiveAccountIds.size > 0) {
          periodTotalSpent = FinanceLogicService.calculatePeriodTotalSpent(
            periodTransactions,
            userActiveAccountIds
          );
          periodTotalIncome = FinanceLogicService.calculatePeriodTotalIncome(
            periodTransactions,
            userActiveAccountIds
          );
          periodTotalTransfers = FinanceLogicService.calculatePeriodTotalTransfers(
            periodTransactions,
            userActiveAccountIds
          );
        }

        // Sort period transactions by amount descending
        const sortedTransactions = [...periodTransactions].sort((a, b) => b.amount - a.amount);

        // Calculate Balances
        const startBalance = runningBalance;
        // Net Change = Income - Spent (Expenses + Outgoing Transfers)
        // Note: verify if periodTotalSpent includes transfers out?
        // FinanceLogicService.calculatePeriodTotalSpent DOES include transfers OUT to external accounts.
        // FinanceLogicService.calculatePeriodTotalIncome DOES include transfers IN from external.
        const netChange = periodTotalIncome - periodTotalSpent;
        const endBalance = startBalance + netChange;

        // Update running for next
        runningBalance = endBalance;

        fullyEnriched.push({
          ...period,
          userName,
          transactions: sortedTransactions,
          defaultAccountStartBalance: userActiveAccountIds.size > 0 ? startBalance : null,
          defaultAccountEndBalance: userActiveAccountIds.size > 0 ? endBalance : null,
          periodTotalSpent,
          periodTotalIncome,
          periodTotalTransfers,
        });
      }
    });

    return fullyEnriched;
  }
}
