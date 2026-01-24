import 'server-only';
import { AccountService } from './account.service';
import { TransactionService } from './transaction.service';
import { BudgetService } from './budget.service';
import { BudgetPeriodService } from './budget-period.service';
import { CategoryService } from './category.service';
import { RecurringService } from './recurring.service';
import { GroupService } from './group.service';
import { FinanceLogicService } from './finance-logic.service';
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
  transactions: Transaction[];
  categories: Category[];
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

    // 2. Parallel Fetch: Metadata + Paginated Transactions + Balances (via Account)
    const [
      accounts,
      transactionResult, // Only first page!
      budgets,
      recurringSeries,
      categories,
      ...periodResults
    ] = await Promise.all([
      AccountService.getAccountsByGroup(groupId).catch((e) => {
        console.error('[PageDataService] Failed to fetch accounts:', e);
        return [] as Account[];
      }),
      // OPTIMIZATION: Fetch only first 50 transactions instead of ALL
      TransactionService.getTransactionsByGroupPaginated(groupId, { limit: 50 }).catch((e) => {
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
      // Fetch active budget period for each user
      ...userIds.map((userId) =>
        BudgetPeriodService.getActivePeriod(userId).catch(() => null)
      ),
    ]);

    // Build budget periods map
    const budgetPeriods: Record<string, BudgetPeriod | null> = {};
    const validPeriods: Record<string, { start: Date; end: Date }> = {};

    userIds.forEach((userId, index) => {
      const period = (periodResults[index] as BudgetPeriod | null) ?? null;
      budgetPeriods[userId] = period;

      // Determine date range for aggregation
      let start: Date, end: Date;
      if (period) {
        start = new Date(period.start_date as string | number | Date);
        // FIX: Ensure end date captures the entire day (23:59:59.999)
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
        TransactionService.getTransactionsByGroupPaginated(groupId, { limit, offset }).catch((e) => {
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
  static async getBudgetsPageData(groupId: string): Promise<BudgetsPageData> {
    // First, get group users to fetch their budget periods
    let userIds: string[] = [];
    try {
      const groupUsers = await GroupService.getGroupUsers(groupId);
      userIds = groupUsers.map((u) => u.id);
    } catch (error) {
      console.error(
        '[PageDataService] Failed to fetch group users:',
        error instanceof Error ? error.message : error
      );
    }

    // Fetch all data in parallel
    const [
      budgets,
      transactions,
      accounts,
      categories,
      ...periodResults
    ] = await Promise.all([
      BudgetService.getBudgetsByGroup(groupId).catch((e) => {
        console.error('[PageDataService] Failed to fetch budgets:', e);
        return [] as Budget[];
      }),
      TransactionService.getTransactionsByGroup(groupId).catch((e) => {
        console.error('[PageDataService] Failed to fetch transactions:', e);
        return [] as Transaction[];
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

    // Build budget periods map (userId -> active period)
    const budgetPeriods: Record<string, BudgetPeriod | null> = {};
    userIds.forEach((userId, index) => {
      budgetPeriods[userId] = (periodResults[index] as BudgetPeriod | null) ?? null;
    });

    return {
      budgets: budgets as Budget[],
      transactions: transactions as Transaction[],
      accounts: accounts as Account[],
      categories: categories as Category[],
      budgetPeriods,
    };
  }

  /**
   * Fetch data for accounts page
   *
   * Fetches: accounts, transactions (parallel)
   * Also calculates account balances from transactions.
   *
   * @param groupId - Group ID to fetch data for
   * @returns Accounts page data with balances
   */
  static async getAccountsPageData(groupId: string): Promise<AccountsPageData> {
    const [accounts, transactions] = await Promise.all([
      AccountService.getAccountsByGroup(groupId).catch((e) => {
        console.error('[PageDataService] Failed to fetch accounts:', e);
        return [] as Account[];
      }),
      TransactionService.getTransactionsByGroup(groupId).catch((e) => {
        console.error('[PageDataService] Failed to fetch transactions:', e);
        return [] as Transaction[];
      }),
    ]);

    // Calculate account balances
    const accountsCast = accounts as Account[];
    const transactionsCast = transactions as Transaction[];
    const accountIds = accountsCast.map((a) => a.id);
    const accountBalances = FinanceLogicService.calculateAccountBalances(
      accountIds,
      transactionsCast
    );

    return {
      accounts: accountsCast,
      transactions: transactionsCast,
      accountBalances,
    };
  }

  /**
   * Fetch data for reports page
   *
   * Fetches: accounts, transactions, categories (parallel)
   *
   * @param groupId - Group ID to fetch data for
   * @returns Reports page data
   */
  static async getReportsPageData(groupId: string): Promise<ReportsPageData> {
    const [accounts, transactions, categories] = await Promise.all([
      AccountService.getAccountsByGroup(groupId).catch((e) => {
        console.error('[PageDataService] Failed to fetch accounts:', e);
        return [] as Account[];
      }),
      TransactionService.getTransactionsByGroup(groupId).catch((e) => {
        console.error('[PageDataService] Failed to fetch transactions:', e);
        return [] as Transaction[];
      }),
      CategoryService.getAllCategories().catch((e) => {
        console.error('[PageDataService] Failed to fetch categories:', e);
        return [] as Category[];
      }),
    ]);

    return {
      accounts: accounts as Account[],
      transactions: transactions as Transaction[],
      categories: categories as Category[],
    };
  }
}
