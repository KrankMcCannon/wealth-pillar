import 'server-only';
import { AccountService } from './account.service';
import { TransactionService } from './transaction.service';
import { BudgetService } from './budget.service';
import { BudgetPeriodService } from './budget-period.service';
import { CategoryService } from './category.service';
import { RecurringService } from './recurring.service';
import { GroupService } from './group.service';
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
      groupUsers = (await GroupService.getGroupUsers(groupId)) as unknown as User[];
      userIds = groupUsers.map((u) => u.id);
    } catch (error) {
      console.error('[PageDataService] Failed to fetch group users:', error);
    }

    // 2. Parallel Fetch: Metadata + Paginated Transactions + Balances + Investments
    // We map users to promises for budget & investments
    const investmentPromises = groupUsers.map((u) =>
      this.safeFetch(
        InvestmentService.getPortfolio(u.id),
        null as unknown as PortfolioResult, // Correct type assertion
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
        AccountService.getAccountsByGroup(groupId),
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
      this.safeFetch(
        CategoryService.getAllCategories(),
        [] as Category[],
        'Failed to fetch categories'
      ),
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
        const { start, end } = validPeriods[userId];
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
      const spendingData = aggregationResults[index];
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
  ): Promise<TransactionsPageData & { total: number; hasMore: boolean }> {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const [transactionResult, categories, accounts, recurringSeries, budgets] = await Promise.all([
      this.safeFetch(
        TransactionService.getTransactionsByGroup(groupId, { limit, offset }),
        { data: [] as Transaction[], total: 0, hasMore: false },
        'Failed to fetch transactions'
      ),
      this.safeFetch(
        CategoryService.getAllCategories(),
        [] as Category[],
        'Failed to fetch categories'
      ),
      this.safeFetch(
        AccountService.getAccountsByGroup(groupId),
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
      groupUsers = (await GroupService.getGroupUsers(groupId)) as unknown as User[];
      userIds = groupUsers.map((u) => u.id);
    } catch (error) {
      console.error(
        '[PageDataService] Failed to fetch group users:',
        error instanceof Error ? error.message : error
      );
    }

    // 2. Fetch Metadata and Active Periods in Parallel
    const [budgets, accounts, categories, ...periodResults] = await Promise.all([
      this.safeFetch(
        BudgetService.getBudgetsByGroup(groupId),
        [] as Budget[],
        'Failed to fetch budgets'
      ),
      this.safeFetch(
        AccountService.getAccountsByGroup(groupId),
        [] as Account[],
        'Failed to fetch accounts'
      ),
      this.safeFetch(
        CategoryService.getAllCategories(),
        [] as Category[],
        'Failed to fetch categories'
      ),
      // Fetch active budget period for each user
      ...userIds.map((userId) =>
        this.safeFetch(
          BudgetPeriodService.getActivePeriod(userId),
          null,
          `Failed to fetch budget period for user ${userId}`
        )
      ),
    ]);

    // 3. Build Budget Periods & Determine Time Range
    const budgetPeriods: Record<string, BudgetPeriod | null> = {};
    const userPeriodRanges: Record<string, { start: Date; end: Date }> = {};

    // Track min/max dates to cover all users (for fetching relevant transactions)
    let minDate: Date | null = null;
    let maxDate: Date | null = null;
    const now = new Date();

    userIds.forEach((userId, index) => {
      const period = periodResults[index] ?? null;
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
        const { start, end } = userPeriodRanges[userId];
        return TransactionService.getGroupUserCategorySpending(groupId, start, end)
          .then((data) => data.filter((r) => r.user_id === userId))
          .catch((e) => {
            console.error(`[PageDataService] Aggregation failed for user ${userId}:`, e);
            return [];
          });
      })
    );

    // 5. Build budgetsByUser Map
    const budgetsByUser: Record<string, UserBudgetSummary> = {};
    groupUsers.forEach((user, index) => {
      const userBudgets = budgets.filter((b) => b.user_id === user.id);
      const spendingData = aggregationResults[index];
      const activePeriod = budgetPeriods[user.id];

      // Use the optimized builder that uses aggregated data
      // We cast to any because TS might complain about private method or exact signature
      // but we know available methods from FinanceLogicService
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
      budgets: budgets,
      // Only return the subset of transactions to keep payload small
      transactions: transactionResult.data,
      accounts: accounts,
      categories: categories,
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
      AccountService.getAccountsByGroup(groupId),
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
    const [
      accounts,
      transactionResult,
      categories,
      groupUsersResult,
      categorySpendingRaw,
      monthlyTrendsRaw,
    ] = await Promise.all([
      this.safeFetch(
        AccountService.getAccountsByGroup(groupId),
        [] as Account[],
        'Failed to fetch accounts'
      ),
      // Fetch all transactions within date range
      this.safeFetch(
        TransactionService.getTransactionsByGroup(groupId, { startDate, endDate: now }),
        { data: [] as Transaction[], total: 0, hasMore: false },
        'Failed to fetch transactions'
      ),
      this.safeFetch(
        CategoryService.getAllCategories(),
        [] as Category[],
        'Failed to fetch categories'
      ),
      this.safeFetch(
        GroupService.getGroupUsers(groupId) as Promise<User[]>,
        [] as User[],
        'Failed to fetch group users'
      ),
      this.safeFetch(
        TransactionService.getGroupCategorySpending(groupId, startDate, now),
        [],
        'Failed to fetch category spending'
      ),
      this.safeFetch(
        TransactionService.getGroupMonthlySpending(groupId, startDate, now),
        [],
        'Failed to fetch monthly trends'
      ),
    ]);

    // Helper to calculate metrics for a subset
    const calcMetrics = (txs: Transaction[]) => {
      const activeAccounts = accounts.filter((a) => a.type === 'payroll' || a.type === 'cash');

      const activeAccountIds = activeAccounts.map((a) => a.id);

      return FinanceLogicService.calculateOverviewMetrics(txs, activeAccountIds, undefined);
    };

    // 1. Calculate Overview Metrics (Global + Per User)
    const overviewMetrics: Record<string, OverviewMetrics> = {};

    // All
    overviewMetrics['all'] = calcMetrics(transactionResult.data);

    // Per User
    groupUsersResult.forEach((u) => {
      // FinanceLogicService can filter by userId internally
      // Filter for active accounts (payroll + cash)
      const userActiveAccounts = accounts.filter((a) => a.type === 'payroll' || a.type === 'cash');

      const activeAccountIds = userActiveAccounts.map((a) => a.id);

      overviewMetrics[u.id] = FinanceLogicService.calculateOverviewMetrics(
        transactionResult.data,
        activeAccountIds,
        u.id
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
      transactionResult.data,
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
    const years = new Set(transactionResult.data.map((t) => new Date(t.date).getFullYear()));
    years.add(new Date().getFullYear());

    // Helper for annual
    const calcAnnual = (txs: Transaction[]) => {
      const res: Record<number, CategoryBreakdownItem[]> = {};
      years.forEach((year) => {
        res[year] = FinanceLogicService.calculateAnnualCategorySpending(txs, year);
      });
      return res;
    };

    annualSpending['all'] = calcAnnual(transactionResult.data);

    groupUsersResult.forEach((u) => {
      annualSpending[u.id] = calcAnnual(transactionResult.data.filter((t) => t.user_id === u.id));
    });

    return {
      accounts,
      transactions: [],
      categories,
      overviewMetrics,
      monthlyTrends: monthlyTrendsRaw as Array<{ month: string; income: number; expense: number }>,
      categorySpending: (categorySpendingRaw || []).map((item) => ({
        category: item.category,
        amount: item.spent,
        count: item.transaction_count,
      })),
      enrichedBudgetPeriods: enrichedFinal,
      annualSpending,
    };
  }
}
