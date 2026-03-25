import { TransactionService } from './transaction.service';
import { BudgetService } from './budget.service';
import { BudgetPeriodService } from './budget-period.service';
import { RecurringService } from './recurring.service';
import {
  getAccountsByGroupDeduped,
  getAllCategoriesDeduped,
  getGroupUsersByGroupIdDeduped,
} from '@/server/request-cache/services';
import { FinanceLogicService, type OverviewMetrics } from './finance-logic.service';
import { InvestmentService } from './investment.service';
import type { PortfolioResult } from './investment.service';
import type {
  Account,
  Transaction,
  Budget,
  BudgetPeriod,
  Category,
  RecurringTransactionSeries,
  UserBudgetSummary,
  User,
  CategoryBreakdownItem,
} from '@/lib/types';
import { toDateTime } from '@/lib/utils/date-utils';
import { DateTime } from 'luxon';
import { ReportPeriodService, type EnrichedBudgetPeriod } from './report-period.service';

/**
 * Page Data Service
 *
 * Centralized service for fetching page-level data with optimal parallel loading.
 * Eliminates Promise.all duplication across dashboard pages.
 *
 * **Architecture Principles:**
 * - Single Responsibility: Each method fetches data for a specific page
 * - DRY: Reuses existing service methods without duplication
 * - Performance: Uses Promise.all for parallel data fetching
 * - Consistency: Same pattern across all dashboard pages
 */

/**
 * Complete dashboard data (all entities)
 */
export interface DashboardPageData {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  budgetPeriods: Record<string, BudgetPeriod | null>; // userId -> active period
  recurringSeries: RecurringTransactionSeries[];
  categories: Category[];
  accountBalances: Record<string, number>;
  budgetsByUser: Record<string, UserBudgetSummary>; // Server-calculated summaries
  investments: Record<string, PortfolioResult | null>; // userId -> portfolio summary
}

/**
 * Transactions page data
 */
export interface TransactionsPageData {
  transactions: Transaction[];
  total: number;
  hasMore: boolean;
  categories: Category[];
  accounts: Account[];
  recurringSeries: RecurringTransactionSeries[];
  budgets: Budget[];
}

/**
 * Budgets page data
 */
export interface BudgetsPageData {
  budgets: Budget[];
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  budgetPeriods: Record<string, BudgetPeriod | null>; // userId -> active period
}

/**
 * Accounts page data
 */
export interface AccountsPageData {
  accounts: Account[];
  transactions: Transaction[];
  accountBalances: Record<string, number>;
}

/**
 * Reports page data
 */
export interface ReportsPageData {
  accounts: Account[];
  transactions?: Transaction[]; // Optional - ideally removed in optimized version
  categories: Category[];
  // Aggregated Data
  // Aggregated Data - Keyed by 'all' | userId
  overviewMetrics: Record<string, OverviewMetrics>;
  monthlyTrends: Array<{ month: string; income: number; expense: number }>;
  categorySpending: Array<{ category: string; amount: number; count: number }>;
  enrichedBudgetPeriods: EnrichedBudgetPeriod[];
  annualSpending: Record<string, Record<number, CategoryBreakdownItem[]>>; // userId -> year -> breakdown
}

/**
 * Page Data Service
 *
 * Provides centralized, optimized data fetching for dashboard pages.
 */
export class PageDataService {
  /**
   * Helper to safely fetch data with error logging and fallback
   */
  private static async safeFetch<T>(promise: Promise<T>, fallback: T, context: string): Promise<T> {
    try {
      return await promise;
    } catch (e) {
      console.error(`[PageDataService] ${context}:`, e);
      return fallback;
    }
  }

  /**
   * Fetch all data for dashboard page
   *
   * Fetches: accounts, transactions, budgets, budget periods, recurring series, categories
   * Also calculates account balances from transactions.
   * Fetches active budget period for each user in parallel.
   *
   * @param groupId - Group ID to fetch data for
   * @returns Complete dashboard data with account balances and budget periods
   */
  static async getDashboardData(groupId: string): Promise<DashboardPageData> {
    // 1. Get group users first
    let userIds: string[] = [];
    let groupUsers: User[] = [];
    try {
      groupUsers = await getGroupUsersByGroupIdDeduped(groupId);
      userIds = groupUsers.map((u) => u.id);
    } catch (error) {
      console.error('[PageDataService] Failed to fetch group users:', error);
    }

    // 2. Parallel Fetch: Metadata + Paginated Transactions + Balances + Investments
    // We map users to promises for budget & investments
    const investmentPromises = groupUsers.map((u) =>
      this.safeFetch<PortfolioResult | null>(
        InvestmentService.getPortfolio(u.id),
        null,
        `Failed to fetch investments for user ${u.id}`
      )
    );

    const [
      accounts,
      transactionResult, // Only first page!
      budgets,
      recurringSeries,
      categories,
      periodMap, // periods
      investmentResults, // investments
    ] = await Promise.all([
      this.safeFetch(
        getAccountsByGroupDeduped(groupId),
        [] as Account[],
        'Failed to fetch accounts'
      ),
      this.safeFetch(
        TransactionService.getTransactionsByGroup(groupId),
        { data: [] as Transaction[], total: 0, hasMore: false },
        'Failed to fetch transactions'
      ),
      this.safeFetch(
        BudgetService.getBudgetsByGroup(groupId),
        [] as Budget[],
        'Failed to fetch budgets'
      ),
      this.safeFetch(
        RecurringService.getSeriesByGroup(groupId),
        [] as RecurringTransactionSeries[],
        'Failed to fetch recurring series'
      ),
      this.safeFetch(getAllCategoriesDeduped(), [] as Category[], 'Failed to fetch categories'),
      this.safeFetch(
        BudgetPeriodService.getActivePeriodForUsers(userIds),
        {} as Record<string, BudgetPeriod | null>,
        'Failed to fetch budget periods'
      ),
      Promise.all(investmentPromises),
    ]);

    // Build budget periods map (moved from array to map)
    const budgetPeriods: Record<string, BudgetPeriod | null> = {};
    const validPeriods: Record<string, { start: Date; end: Date }> = {};

    // Build Investment Map
    const investments: Record<string, PortfolioResult | null> = {};

    userIds.forEach((userId, index) => {
      // Budget Periods
      const period = periodMap?.[userId] ?? null;
      budgetPeriods[userId] = period;

      // Investments
      investments[userId] = investmentResults?.[index] || null;

      // Determine date range for aggregation
      let start: Date, end: Date;
      if (period) {
        start = new Date(period.start_date);
        const endDateTime = toDateTime(period.end_date ?? '');
        end = endDateTime ? endDateTime.endOf('day').toJSDate() : new Date();
      } else {
        // Default to current month if no period set
        const now = DateTime.now();
        start = now.startOf('month').toJSDate();
        end = now.endOf('month').toJSDate();
      }
      validPeriods[userId] = { start, end };
    });

    // 3. Parallel Fetch: User Budget Aggregations
    // Fetch aggregated spending for each user based on their specific period
    const aggregationResults = await Promise.all(
      userIds.map((userId) => {
        const period = validPeriods[userId];
        if (!period) return Promise.resolve([]);
        const { start, end } = period;
        return TransactionService.getGroupUserCategorySpending(groupId, start, end)
          .then((data) => data.filter((r) => r.user_id === userId)) // Filter strictly for safety
          .catch((e) => {
            console.error(`[PageDataService] Aggregation failed for user ${userId}:`, e);
            return [];
          });
      })
    );

    // 4. Build Budgets By User Map
    const budgetsByUser: Record<string, UserBudgetSummary> = {};

    groupUsers.forEach((user, index) => {
      const userBudgets = budgets.filter((b) => b.user_id === user.id);
      const spendingData = aggregationResults[index] ?? [];
      const activePeriod = budgetPeriods[user.id];

      budgetsByUser[user.id] = FinanceLogicService.calculateUserBudgetSummaryFromAggregation(
        user,
        userBudgets,
        spendingData,
        activePeriod
      );
    });

    // 5. Account Balances (from Column)
    // No more manual calculation! Use the DB column.
    const accountBalances: Record<string, number> = {};
    accounts.forEach((a) => {
      accountBalances[a.id] = Number(a.balance) || 0;
    });

    return {
      accounts,
      transactions: transactionResult.data,
      budgets,
      budgetPeriods,
      recurringSeries,
      categories,
      accountBalances,
      budgetsByUser,
      investments,
    };
  }

  /**
   * Fetch data for transactions page (paginated)
   *
   * Fetches: transactions (first 50), categories, accounts, recurring series, budgets
   *
   * @param groupId - Group ID to fetch data for
   * @param options - Pagination options
   * @returns Transactions page data with pagination info
   */
  static async getTransactionsPageData(
    groupId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<TransactionsPageData> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const [transactionResult, categories, accounts, recurringSeries, budgets] = await Promise.all([
      this.safeFetch(
        TransactionService.getTransactionsByGroup(groupId, { limit, offset }),
        { data: [] as Transaction[], total: 0, hasMore: false },
        'Failed to fetch transactions'
      ),
      this.safeFetch(getAllCategoriesDeduped(), [] as Category[], 'Failed to fetch categories'),
      this.safeFetch(
        getAccountsByGroupDeduped(groupId),
        [] as Account[],
        'Failed to fetch accounts'
      ),
      this.safeFetch(
        RecurringService.getSeriesByGroup(groupId),
        [] as RecurringTransactionSeries[],
        'Failed to fetch recurring series'
      ),
      this.safeFetch(
        BudgetService.getBudgetsByGroup(groupId),
        [] as Budget[],
        'Failed to fetch budgets'
      ),
    ]);

    return {
      transactions: transactionResult.data,
      total: transactionResult.total,
      hasMore: transactionResult.hasMore,
      categories,
      accounts,
      recurringSeries,
      budgets,
    };
  }

  /**
   * Fetch data for budgets page
   *
   * Fetches: budgets, transactions, accounts, categories, budget periods (parallel)
   * Fetches active budget period for each user in the group.
   *
   * @param groupId - Group ID to fetch data for
   * @returns Budgets page data with active budget periods
   */
  static async getBudgetsPageData(
    groupId: string
  ): Promise<BudgetsPageData & { budgetsByUser: Record<string, UserBudgetSummary> }> {
    // 1. Get group users first
    let userIds: string[] = [];
    let groupUsers: User[] = [];
    try {
      groupUsers = await getGroupUsersByGroupIdDeduped(groupId);
      userIds = groupUsers.map((u) => u.id);
    } catch (error) {
      console.error(
        '[PageDataService] Failed to fetch group users:',
        error instanceof Error ? error.message : error
      );
    }

    // 2. Fetch Metadata and active periods (batch load)
    const [budgets, accounts, categories, periodMap] = await Promise.all([
      this.safeFetch(
        BudgetService.getBudgetsByGroup(groupId),
        [] as Budget[],
        'Failed to fetch budgets'
      ),
      this.safeFetch(
        getAccountsByGroupDeduped(groupId),
        [] as Account[],
        'Failed to fetch accounts'
      ),
      this.safeFetch(getAllCategoriesDeduped(), [] as Category[], 'Failed to fetch categories'),
      this.safeFetch(
        BudgetPeriodService.getActivePeriodForUsers(userIds),
        {} as Record<string, BudgetPeriod | null>,
        'Failed to fetch budget periods'
      ),
    ]);

    // 3. Build Budget Periods & Determine Time Range
    const budgetPeriods: Record<string, BudgetPeriod | null> = {};
    const userPeriodRanges: Record<string, { start: Date; end: Date }> = {};

    // Track min/max dates to cover all users (for fetching relevant transactions)
    let minDate: Date | null = null;
    let maxDate: Date | null = null;
    const now = new Date();

    userIds.forEach((userId) => {
      const period = periodMap?.[userId] ?? null;
      budgetPeriods[userId] = period;

      let start: Date, end: Date;
      if (period) {
        start = new Date(period.start_date);
        const endDateTime = toDateTime(period.end_date ?? '');
        end = endDateTime ? endDateTime.endOf('day').toJSDate() : now;
      } else {
        // Default to current month
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      }
      userPeriodRanges[userId] = { start, end };

      if (!minDate || start < minDate) minDate = start;
      if (!maxDate || end > maxDate) maxDate = end;
    });

    // 4. Fetch Aggregated Spending (Parallel per User)
    // We fetch one aggregated result per user according to their period
    const aggregationResults = await Promise.all(
      userIds.map((userId) => {
        const period = userPeriodRanges[userId];
        if (!period) return Promise.resolve([]);
        const { start, end } = period;
        return TransactionService.getGroupUserCategorySpending(groupId, start, end)
          .then((data) => data.filter((r) => r.user_id === userId))
          .catch((e) => {
            console.error(`[PageDataService] Aggregation failed for user ${userId}:`, e);
            return [];
          });
      })
    );

    const budgetsByUserId = new Map<string, Budget[]>();
    for (const b of budgets) {
      const uid = b.user_id;
      let list = budgetsByUserId.get(uid);
      if (!list) {
        list = [];
        budgetsByUserId.set(uid, list);
      }
      list.push(b);
    }

    // 5. Build budgetsByUser Map
    const budgetsByUser: Record<string, UserBudgetSummary> = {};
    groupUsers.forEach((user, index) => {
      const userBudgets = budgetsByUserId.get(user.id) ?? [];
      const spendingData = aggregationResults[index] ?? [];
      const activePeriod = budgetPeriods[user.id];

      budgetsByUser[user.id] = FinanceLogicService.calculateUserBudgetSummaryFromAggregation(
        user,
        userBudgets,
        spendingData,
        activePeriod
      );
    });

    // 6. Fetch Recent Transactions
    const transactionResult = await TransactionService.getTransactionsByGroup(groupId, {
      startDate: minDate ?? undefined,
      endDate: maxDate ?? undefined,
    }).catch((e) => {
      console.error('[PageDataService] Failed to fetch transactions:', e);
      return { data: [] as Transaction[], total: 0, hasMore: false };
    });

    return {
      budgets,
      // Only return the subset of transactions to keep payload small
      transactions: transactionResult.data,
      accounts,
      categories,
      budgetPeriods,
      budgetsByUser, // Add the pre-calculated map
    };
  }

  /**
   * Fetch data for accounts page (OPTIMIZED)
   *
   * Fetches: accounts with stored balances only
   * No transactions needed - balances are stored in accounts table
   *
   * @param groupId - Group ID to fetch data for
   * @returns Accounts page data with balances from stored column
   */
  static async getAccountsPageData(groupId: string): Promise<AccountsPageData> {
    const accounts = await this.safeFetch(
      getAccountsByGroupDeduped(groupId),
      [] as Account[],
      'Failed to fetch accounts'
    );

    // Use stored balance from accounts table (already calculated on transaction mutations)
    const accountBalances: Record<string, number> = {};
    for (const account of accounts) {
      accountBalances[account.id] = account.balance ?? 0;
    }

    return {
      accounts,
      transactions: [],
      accountBalances,
    };
  }

  /**
   * Fetch data for reports page (OPTIMIZED)
   *
   * Fetches: accounts, categories, transactions filtered by date range
   * No limit - reports need complete data within date range
   *
   * @param groupId - Group ID to fetch data for
   * @returns Reports page data
   */
  static async getReportsPageData(groupId: string): Promise<ReportsPageData> {
    // Calculate date range for last 24 months
    const now = new Date();
    const startDate = new Date(now.getFullYear() - 2, now.getMonth(), 1); // 2 years ago

    // Fetch raw data needed for calculations (keeping it server-side)
    const [accounts, transactionResult, categories, groupUsersResult] = await Promise.all([
      this.safeFetch(
        getAccountsByGroupDeduped(groupId),
        [] as Account[],
        'Failed to fetch accounts'
      ),
      this.safeFetch(
        TransactionService.getTransactionsByGroup(groupId, { startDate, endDate: now }),
        { data: [] as Transaction[], total: 0, hasMore: false },
        'Failed to fetch transactions'
      ),
      this.safeFetch(getAllCategoriesDeduped(), [] as Category[], 'Failed to fetch categories'),
      this.safeFetch(
        getGroupUsersByGroupIdDeduped(groupId),
        [] as User[],
        'Failed to fetch group users'
      ),
    ]);

    const txs = transactionResult.data;
    const monthlyTrends = FinanceLogicService.aggregateMonthlyIncomeExpenseForReports(
      txs,
      startDate,
      now
    );
    const categorySpending = FinanceLogicService.aggregateGroupCategorySpendingForReports(
      txs,
      startDate,
      now
    ).map((item) => ({
      category: item.category,
      amount: item.amount,
      count: item.count,
    }));

    const txsByUserId = new Map<string, Transaction[]>();
    for (const t of txs) {
      const uid = t.user_id;
      if (!uid) continue;
      const list = txsByUserId.get(uid) ?? [];
      list.push(t);
      txsByUserId.set(uid, list);
    }

    // Helper to calculate metrics for a subset
    const calcMetrics = (txs: Transaction[]) => {
      const activeAccounts = accounts.filter((a) => a.type === 'payroll' || a.type === 'cash');

      const activeAccountIds = activeAccounts.map((a) => a.id);

      return FinanceLogicService.calculateOverviewMetrics(txs, activeAccountIds, undefined);
    };

    // 1. Calculate Overview Metrics (Global + Per User)
    const overviewMetrics: Record<string, OverviewMetrics> = {};

    // All
    overviewMetrics['all'] = calcMetrics(txs);

    // Per User (pre-indexed transactions per user — O(U + T) vs O(U × T))
    groupUsersResult.forEach((u) => {
      const userActiveAccounts = accounts.filter((a) => a.type === 'payroll' || a.type === 'cash');
      const activeAccountIds = userActiveAccounts.map((a) => a.id);
      const userTxs = txsByUserId.get(u.id) ?? [];
      overviewMetrics[u.id] = FinanceLogicService.calculateOverviewMetrics(
        userTxs,
        activeAccountIds,
        undefined
      );
    });

    // 2. Fetch Budget Periods... (Same as before)
    const allUserIds = groupUsersResult.map((u) => u.id);
    const budgetPeriods: BudgetPeriod[] = [];
    await Promise.all(
      allUserIds.map(async (uid) => {
        const periods = await BudgetPeriodService.getPeriodsByUser(uid);
        if (periods) budgetPeriods.push(...periods);
      })
    );

    // 3. Enrich Budget Periods (Server-Side)
    const enrichedFull = ReportPeriodService.enrichBudgetPeriods(
      budgetPeriods,
      groupUsersResult,
      txs,
      accounts
    );

    // User requested to ALWAYS show transactions, so we do not strip them anymore.
    // This may impact performance but is required behavior.
    const enrichedFinal = enrichedFull.map((p) => ({
      ...p,
      // Ensure transactions are included
      transactionCount: p.transactions.length,
    }));

    // 4. Calculate Annual Breakdown (Global + Per User)
    const annualSpending: Record<string, Record<number, CategoryBreakdownItem[]>> = {};
    const years = new Set(txs.map((t) => new Date(t.date).getFullYear()));
    years.add(new Date().getFullYear());

    // Helper for annual
    const calcAnnual = (txs: Transaction[]) => {
      const res: Record<number, CategoryBreakdownItem[]> = {};
      years.forEach((year) => {
        res[year] = FinanceLogicService.calculateAnnualCategorySpending(txs, year);
      });
      return res;
    };

    annualSpending['all'] = calcAnnual(txs);

    groupUsersResult.forEach((u) => {
      annualSpending[u.id] = calcAnnual(txsByUserId.get(u.id) ?? []);
    });

    return {
      accounts,
      transactions: [],
      categories,
      overviewMetrics,
      monthlyTrends,
      categorySpending,
      enrichedBudgetPeriods: enrichedFinal,
      annualSpending,
    };
  }
}
