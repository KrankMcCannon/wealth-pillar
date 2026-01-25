import 'server-only';
import { AccountService } from './account.service';
import { TransactionService } from './transaction.service';
import { BudgetService } from './budget.service';
import { BudgetPeriodService } from './budget-period.service';
import { CategoryService } from './category.service';
import { RecurringService } from './recurring.service';
import { GroupService } from './group.service';
import { FinanceLogicService } from './finance-logic.service';
import { InvestmentService } from './investment.service';
import type {
  Account,
  Transaction,
  Budget,
  BudgetPeriod,
  Category,
  RecurringTransactionSeries,
  UserBudgetSummary,
  User
} from '@/lib/types';
import { toDateTime } from '@/lib/utils/date-utils';
import { DateTime } from 'luxon';
import { ReportPeriodService } from './report-period.service';

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
  investments: Record<string, any>; // userId -> portfolio summary
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
  overviewMetrics: Record<string, {
    totalEarned: number;
    totalSpent: number;
    totalTransferred: number;
    totalBalance: number;
  }>;
  monthlyTrends: Array<{ month: string; income: number; expense: number }>;
  categorySpending: Array<{ category: string; amount: number; count: number }>;
  enrichedBudgetPeriods: any[];
  annualSpending: Record<string, Record<number, any[]>>; // userId -> year -> breakdown
}

/**
 * Page Data Service
 *
 * Provides centralized, optimized data fetching for dashboard pages.
 */
export class PageDataService {
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
    const investmentPromises = groupUsers.map(u => InvestmentService.getPortfolio(u.id).catch(e => {
      console.error(`[PageDataService] Failed to fetch investments for user ${u.id}:`, e);
      return null;
    }));
    const [
      accounts,
      transactionResult, // Only first page!
      budgets,
      recurringSeries,
      categories,
      periodMap,           // periods
      investmentResults    // investments
    ] = await Promise.all([
      AccountService.getAccountsByGroup(groupId).catch((e) => {
        console.error('[PageDataService] Failed to fetch accounts:', e);
        return [] as Account[];
      }),
      // OPTIMIZATION: Fetch only first 50 transactions instead of ALL
      TransactionService.getTransactionsByGroup(groupId, { limit: 50 }).catch((e) => {
        console.error('[PageDataService] Failed to fetch transactions:', e);
        return { data: [] as Transaction[], total: 0, hasMore: false };
      }),
      BudgetService.getBudgetsByGroup(groupId).catch((e) => {
        console.error('[PageDataService] Failed to fetch budgets:', e);
        return [] as Budget[];
      }),
      RecurringService.getSeriesByGroup(groupId).catch((e) => {
        console.error('[PageDataService] Failed to fetch recurring series:', e);
        return [] as RecurringTransactionSeries[];
      }),
      CategoryService.getAllCategories().catch((e) => {
        console.error('[PageDataService] Failed to fetch categories:', e);
        return [] as Category[];
      }),
      BudgetPeriodService.getActivePeriodForUsers(userIds).catch((e) => {
        console.error('[PageDataService] Failed to fetch budget periods:', e);
        return {} as Record<string, BudgetPeriod | null>;
      }),
      Promise.all(investmentPromises)
    ]);

    // Build budget periods map (moved from array to map)
    const budgetPeriods: Record<string, BudgetPeriod | null> = {};
    const validPeriods: Record<string, { start: Date; end: Date }> = {};

    // Build Investment Map
    const investments: Record<string, any> = {};

    userIds.forEach((userId, index) => {
      // Budget Periods
      const period = (periodMap?.[userId] as BudgetPeriod | null) ?? null;
      budgetPeriods[userId] = period;

      // Investments
      investments[userId] = investmentResults?.[index] || null;

      // Determine date range for aggregation
      let start: Date, end: Date;
      if (period) {
        start = new Date(period.start_date as string | number | Date);
        const endDateTime = toDateTime(period.end_date as any);
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
      userIds.map(userId => {
        const { start, end } = validPeriods[userId];
        return TransactionService.getGroupUserCategorySpending(groupId, start, end)
          .then(data => data.filter(r => r.user_id === userId)) // Filter strictly for safety
          .catch(e => {
            console.error(`[PageDataService] Aggregation failed for user ${userId}:`, e);
            return [];
          });
      })
    );

    // 4. Build Budgets By User Map
    const budgetsByUser: Record<string, UserBudgetSummary> = {};

    groupUsers.forEach((user, index) => {
      const userBudgets = budgets.filter(b => b.user_id === user.id);
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
    (accounts as Account[]).forEach(a => {
      accountBalances[a.id] = Number(a.balance) || 0;
    });

    return {
      accounts: accounts as Account[],
      transactions: transactionResult.data as Transaction[],
      budgets: budgets as Budget[],
      budgetPeriods,
      recurringSeries: recurringSeries as RecurringTransactionSeries[],
      categories: categories as Category[],
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

    const [transactionResult, categories, accounts, recurringSeries, budgets] =
      await Promise.all([
        TransactionService.getTransactionsByGroup(groupId, { limit, offset }).catch((e) => {
          console.error('[PageDataService] Failed to fetch transactions:', e);
          return { data: [] as Transaction[], total: 0, hasMore: false };
        }),
        CategoryService.getAllCategories().catch((e) => {
          console.error('[PageDataService] Failed to fetch categories:', e);
          return [] as Category[];
        }),
        AccountService.getAccountsByGroup(groupId).catch((e) => {
          console.error('[PageDataService] Failed to fetch accounts:', e);
          return [] as Account[];
        }),
        RecurringService.getSeriesByGroup(groupId).catch((e) => {
          console.error(
            '[PageDataService] Failed to fetch recurring series:',
            e
          );
          return [] as RecurringTransactionSeries[];
        }),
        BudgetService.getBudgetsByGroup(groupId).catch((e) => {
          console.error('[PageDataService] Failed to fetch budgets:', e);
          return [] as Budget[];
        }),
      ]);

    return {
      transactions: transactionResult.data as Transaction[],
      total: transactionResult.total,
      hasMore: transactionResult.hasMore,
      categories: categories as Category[],
      accounts: accounts as Account[],
      recurringSeries: recurringSeries as RecurringTransactionSeries[],
      budgets: budgets as Budget[],
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
  static async getBudgetsPageData(groupId: string): Promise<BudgetsPageData & { budgetsByUser: Record<string, UserBudgetSummary> }> {
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
    const [
      budgets,
      accounts,
      categories,
      ...periodResults
    ] = await Promise.all([
      BudgetService.getBudgetsByGroup(groupId).catch((e) => {
        console.error('[PageDataService] Failed to fetch budgets:', e);
        return [] as Budget[];
      }),
      AccountService.getAccountsByGroup(groupId).catch((e) => {
        console.error('[PageDataService] Failed to fetch accounts:', e);
        return [] as Account[];
      }),
      CategoryService.getAllCategories().catch((e) => {
        console.error('[PageDataService] Failed to fetch categories:', e);
        return [] as Category[];
      }),
      // Fetch active budget period for each user
      ...userIds.map((userId) =>
        BudgetPeriodService.getActivePeriod(userId).catch((e) => {
          console.error(
            `[PageDataService] Failed to fetch budget period for user ${userId}:`,
            e
          );
          return null;
        })
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
      const period = (periodResults[index] as BudgetPeriod | null) ?? null;
      budgetPeriods[userId] = period;

      let start: Date, end: Date;
      if (period) {
        start = new Date(period.start_date as string | number | Date);
        const endDateTime = toDateTime(period.end_date as any);
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
      userIds.map(userId => {
        const { start, end } = userPeriodRanges[userId];
        return TransactionService.getGroupUserCategorySpending(groupId, start, end)
          .then(data => data.filter(r => r.user_id === userId))
          .catch(e => {
            console.error(`[PageDataService] Aggregation failed for user ${userId}:`, e);
            return [];
          });
      })
    );

    // 5. Build budgetsByUser Map
    const budgetsByUser: Record<string, UserBudgetSummary> = {};
    groupUsers.forEach((user, index) => {
      const userBudgets = (budgets as Budget[]).filter(b => b.user_id === user.id);
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

    // 6. Fetch Recent Transactions (Limit 100)
    // We only fetch recent ones for the UI list. The progress bars are already correct via aggregation.
    // If we want to support the CHART, we need daily data.
    // The chart component currently filters client-side from the `transactions` array passed.
    // Compromise: Fetch transactions covering the WIDEST active range found above.
    const transactionResult = await TransactionService.getTransactionsByGroup(groupId, {
      limit: 200, // Reasonable limit for chart/list 
      startDate: minDate || undefined,
      endDate: maxDate || undefined
    }).catch((e) => {
      console.error('[PageDataService] Failed to fetch transactions:', e);
      return { data: [] as Transaction[], total: 0, hasMore: false };
    });

    return {
      budgets: budgets as Budget[],
      // Only return the subset of transactions to keep payload small
      transactions: transactionResult.data as Transaction[],
      accounts: accounts as Account[],
      categories: categories as Category[],
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
    const accounts = await AccountService.getAccountsByGroup(groupId).catch((e) => {
      console.error('[PageDataService] Failed to fetch accounts:', e);
      return [] as Account[];
    });

    // Use stored balance from accounts table (already calculated on transaction mutations)
    const accountsCast = accounts as Account[];
    const accountBalances: Record<string, number> = {};
    for (const account of accountsCast) {
      accountBalances[account.id] = account.balance ?? 0;
    }

    return {
      accounts: accountsCast,
      transactions: [], // No transactions needed - use stored balances
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
      monthlyTrendsRaw
    ] = await Promise.all([
      AccountService.getAccountsByGroup(groupId).catch((e) => {
        console.error('[PageDataService] Failed to fetch accounts:', e);
        return [] as Account[];
      }),
      // Fetch all transactions within date range
      TransactionService.getTransactionsByGroup(groupId, {
        startDate,
        endDate: now
      }).catch((e) => {
        console.error('[PageDataService] Failed to fetch transactions:', e);
        return { data: [] as Transaction[], total: 0, hasMore: false };
      }),
      CategoryService.getAllCategories().catch((e) => {
        console.error('[PageDataService] Failed to fetch categories:', e);
        return [] as Category[];
      }),
      GroupService.getGroupUsers(groupId).catch((e) => {
        console.error('[PageDataService] Failed to fetch group users:', e);
        return [] as User[];
      }),
      TransactionService.getGroupCategorySpending(groupId, startDate, now).catch((e) => {
        console.error('[PageDataService] Failed to fetch category spending:', e);
        return [] as Array<{ category: string; spent: number; transaction_count: number }>;
      }),
      TransactionService.getGroupMonthlySpending(groupId, startDate, now).catch((e) => {
        console.error('[PageDataService] Failed to fetch monthly trends:', e);
        return [] as Array<{ month: string; income: number; expense: number }>;
      }),
    ]);

    const transactions = transactionResult.data as Transaction[];
    const groupUsers = groupUsersResult as User[];

    // Helper to calculate metrics for a subset
    const calcMetrics = (txs: Transaction[]) =>
      FinanceLogicService.calculateOverviewMetrics(txs, accounts.map(a => a.id));

    // 1. Calculate Overview Metrics (Global + Per User)
    const overviewMetrics: Record<string, any> = {};

    // All
    overviewMetrics['all'] = calcMetrics(transactions);

    // Per User
    groupUsers.forEach(u => {
      // FinanceLogicService can filter by userId internally
      overviewMetrics[u.id] = FinanceLogicService.calculateOverviewMetrics(transactions, accounts.map(a => a.id), u.id);
    });


    // 2. Fetch Budget Periods... (Same as before)
    const allUserIds = groupUsers.map(u => u.id);
    const budgetPeriods: BudgetPeriod[] = [];
    await Promise.all(allUserIds.map(async (uid) => {
      const periods = await BudgetPeriodService.getPeriodsByUser(uid);
      if (periods) budgetPeriods.push(...periods);
    }));

    // 3. Enrich Budget Periods (Server-Side)
    const enrichedFull = ReportPeriodService.enrichBudgetPeriods(
      budgetPeriods,
      groupUsers,
      transactions,
      accounts
    );

    // User requested to ALWAYS show transactions, so we do not strip them anymore.
    // This may impact performance but is required behavior.
    const enrichedFinal = enrichedFull.map((p) => ({
      ...p,
      // Ensure transactions are included
      transactionCount: p.transactions.length
    }));

    // 4. Calculate Annual Breakdown (Global + Per User)
    const annualSpending: Record<string, Record<number, any[]>> = {};
    const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
    years.add(new Date().getFullYear());

    // Helper for annual
    const calcAnnual = (txs: Transaction[]) => {
      const res: Record<number, any[]> = {};
      years.forEach(year => {
        res[year] = FinanceLogicService.calculateAnnualCategorySpending(txs, year);
      });
      return res;
    };

    annualSpending['all'] = calcAnnual(transactions);

    groupUsers.forEach(u => {
      annualSpending[u.id] = calcAnnual(transactions.filter(t => t.user_id === u.id));
    });

    return {
      accounts: accounts as Account[],
      transactions: [],
      categories: categories as Category[],
      overviewMetrics,
      monthlyTrends: monthlyTrendsRaw as Array<{ month: string; income: number; expense: number }>,
      categorySpending: (categorySpendingRaw || []).map(item => ({
        category: item.category,
        amount: item.spent,
        count: item.transaction_count,
      })),
      enrichedBudgetPeriods: enrichedFinal,
      annualSpending
    };
  }
}
